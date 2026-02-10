import { sql } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import { deviceData, devices } from '../db/schema'

type MainStreamDevice = {
  deviceId: string
  deviceSecretKey: string
  monitorItem: string
}

type MainStreamBatchResponse = {
  code: number
  data: Array<{
    data: Array<{
      monitorItem: string
      monitorTime: string
      monitorValue: string
      nodeId?: string
    }>
    dataStatus: number
    deviceId: string
    deviceStatus: number
    id: number
    customname: string
    name: string
    sensorNumber: number
  }>
  message: string
  status: string
}

type MainStreamLatestResponse = {
  code: number
  monitorValue: string
  monitorTime: string
}

const hourMs = 30 * 60 * 1000
const deviceCacheTtlMs = Number(process.env.DEVICE_CACHE_TTL_MS ?? 300000)

const deviceCache = {
  devices: [] as MainStreamDevice[],
  lastFetched: 0
}

const isConnectionLostError = (error: unknown) => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'PROTOCOL_CONNECTION_LOST'
  )
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })

const warmUpDatabase = async (database: MySql2Database) => {
  try {
    await database.execute(sql`select 1`)
  } catch (error) {
    if (!isConnectionLostError(error)) {
      throw error
    }
    await sleep(500)
    await database.execute(sql`select 1`)
  }
}

const translateMainStreamMessage = (message: string) => {
  const translations: Record<string, string> = {
    '当前ip并发查询限制为1次,每秒钟查询限制为1次,每分钟查询限制为10次,限制条件触发':
      'Rate limit triggered: 1 concurrent, 1 per second, 10 per minute.'
  }

  return translations[message] ?? message
}

const toGmtPlus7 = (monitorTime: string) => {
  const match = monitorTime.match(
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/
  )

  if (!match) {
    return monitorTime
  }

  const [datePart, timePart] = monitorTime.split(' ')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute, second] = timePart.split(':')

  const base = new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      Number(hour),
      Number(minute),
      Number(second)
    )
  )

  if (Number.isNaN(base.getTime())) {
    return monitorTime
  }

  const shifted = new Date(base.getTime() + 7 * 60 * 60 * 1000)
  const now = new Date()
  const nowGmtPlus7 = new Date(now.getTime() + 7 * 60 * 60 * 1000)
  let effective = shifted

  if (shifted > nowGmtPlus7) {
    let clampedByHour = new Date(
      Date.UTC(
        nowGmtPlus7.getUTCFullYear(),
        nowGmtPlus7.getUTCMonth(),
        nowGmtPlus7.getUTCDate(),
        nowGmtPlus7.getUTCHours(),
        shifted.getUTCMinutes(),
        shifted.getUTCSeconds()
      )
    )
    if (clampedByHour > nowGmtPlus7) {
      clampedByHour = new Date(clampedByHour.getTime() - 60 * 60 * 1000)
    }
    effective = clampedByHour > nowGmtPlus7 ? nowGmtPlus7 : clampedByHour
  }
  const pad = (value: number) => String(value).padStart(2, '0')

  return `${effective.getUTCFullYear()}-${pad(
    effective.getUTCMonth() + 1
  )}-${pad(effective.getUTCDate())} ${pad(
    effective.getUTCHours()
  )}:${pad(effective.getUTCMinutes())}:${pad(
    effective.getUTCSeconds()
  )}`
}

const loadDevicesFromDatabase = async (database: MySql2Database) => {
  const rows = await database.select().from(devices)

  return rows.flatMap((device) => {
    if (!device.deviceId || !device.monitorItem || !device.deviceKey) {
      return []
    }

    return [
      {
        deviceId: device.deviceId,
        deviceSecretKey: device.deviceKey,
        monitorItem: device.monitorItem
      }
    ]
  })
}

const refreshDeviceCache = async (database: MySql2Database) => {
  deviceCache.devices = await loadDevicesFromDatabase(database)
  deviceCache.lastFetched = Date.now()
}

const refreshDeviceCacheWithRetry = async (database: MySql2Database) => {
  try {
    await refreshDeviceCache(database)
  } catch (error) {
    if (!isConnectionLostError(error)) {
      throw error
    }
    await sleep(1000)
    await refreshDeviceCache(database)
  }
}

const fetchBatch = async (
  baseUrl: string,
  devices: MainStreamDevice[],
  start: number,
  end: number
) => {
  const response = await fetch(`${baseUrl}/batch`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      deviceList: devices.map(({ deviceId, deviceSecretKey }) => ({
        deviceId,
        deviceSecretKey
      })),
      monitorItem: devices.map((device) => device.monitorItem).join(', '),
      start,
      end
    })
  })

  if (!response.ok) {
    const text = await response.text()
    let translated = text

    try {
      const json = JSON.parse(text) as { message?: string }
      if (json.message) {
        translated = translateMainStreamMessage(json.message)
      }
    } catch {
      translated = translateMainStreamMessage(text)
    }

    throw new Error(
      `Main stream batch failed: ${response.status} ${translated}`
    )
  }

  return (await response.json()) as MainStreamBatchResponse
}

const fetchLatest = async (
  baseUrl: string,
  device: MainStreamDevice
): Promise<MainStreamLatestResponse> => {
  const response = await fetch(`${baseUrl}/latest`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      deviceId: device.deviceId,
      deviceSecretKey: device.deviceSecretKey,
      monitorItem: device.monitorItem
    })
  })

  if (!response.ok) {
    return {
      code: response.status,
      monitorValue: '',
      monitorTime: ''
    }
  }

  const payload = await response.json()
  const dataItem = payload?.data?.find(
    (item: { data?: Array<{ monitorValue?: string; monitorTime?: string }> }) =>
      Array.isArray(item.data) && item.data.length > 0
  )?.data?.[0]

  return {
    code: typeof payload?.code === 'number' ? payload.code : response.status,
    monitorValue: dataItem?.monitorValue ?? '',
    monitorTime: dataItem?.monitorTime ?? ''
  }
}


const storeBatch = async (
  database: MySql2Database,
  payload: MainStreamBatchResponse
) => {
  if (!payload || !Array.isArray(payload.data)) {
    const translated = payload?.message
      ? translateMainStreamMessage(payload.message)
      : undefined
    console.warn('Main stream payload missing data field', {
      ...payload,
      translatedMessage: translated
    })
    return
  }

  const rows = payload.data.flatMap((device) =>
    device.data.map((item) => ({
      deviceId: device.deviceId,
      monitorItem: item.monitorItem,
      monitorTime: toGmtPlus7(item.monitorTime),
      monitorValue: item.monitorValue,
    }))
  )

  if (rows.length === 0) {
    return
  }

  await database
    .insert(deviceData)
    .values(rows)
    .onDuplicateKeyUpdate({
      set: { monitorValue: sql`monitorValue` }
    })
}

const storeLatest = async (
  database: MySql2Database,
  device: MainStreamDevice,
  payload: MainStreamLatestResponse
) => {
  if (!payload.monitorTime || !payload.monitorValue) {
    return
  }

  const normalizedTime = toGmtPlus7(payload.monitorTime)

  await database
    .insert(deviceData)
    .values({
      deviceId: device.deviceId,
      monitorItem: device.monitorItem,
      monitorTime: normalizedTime,
      monitorValue: payload.monitorValue
    })
    .onDuplicateKeyUpdate({
      set: { monitorValue: sql`monitorValue` }
    })
}

export const startMainStreamSync = (
  database: MySql2Database,
  intervalMs: number = hourMs
) => {
  const baseUrl = process.env.MAIN_STREAM_URL

  if (!baseUrl) {
    console.warn('MAIN_STREAM_URL is not set. Main stream sync disabled.')
    return
  }

  const runSync = async () => {
    await warmUpDatabase(database)
    const end = Date.now()
    const start = end - hourMs

    if (
      deviceCache.devices.length === 0 ||
      Date.now() - deviceCache.lastFetched > deviceCacheTtlMs
    ) {
      await refreshDeviceCacheWithRetry(database)
    }

    const devices = deviceCache.devices

    if (devices.length === 0) {
      console.warn('No main stream devices available. Sync skipped.')
      return
    }

    try {
      const payload = await fetchBatch(baseUrl, devices, start, end)
      await storeBatch(database, payload)
      for (const device of devices) {
        try {
          const latestPayload = await fetchLatest(baseUrl, device)
          await storeLatest(database, device, latestPayload)
        } catch (error) {
          console.error('Main stream latest sync failed', error)
        }
      }
      console.log('Main stream sync completed successfully')
    } catch (error) {
      console.error('Main stream sync failed', error)
    }
  }
  void runSync()
  setInterval(runSync, intervalMs)
}