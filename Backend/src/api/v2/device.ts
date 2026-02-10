import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { sql } from 'drizzle-orm'
import { and, eq } from 'drizzle-orm/sql/expressions/conditions'
import { db } from '../..'
import { deviceData, deviceOwners, devices } from '../../db/schema'

const deviceDataItem = t.Object({
  monitorItem: t.String(),
  monitorTime: t.String(),
  monitorValue: t.String(),
  nodeId: t.Optional(t.String())
})

const deviceResponseItem = t.Object({
  data: t.Array(deviceDataItem),
  dataStatus: t.Number(),
  deviceId: t.String(),
  deviceStatus: t.Number(),
  id: t.Number(),
  customname: t.Optional(t.String()),
  name: t.String(),
  sensorNumber: t.Number()
})

const deviceResponseSchema = t.Object({
  code: t.Number(),
  data: t.Array(deviceResponseItem),
  message: t.String(),
  status: t.String()
})

const deviceLatestResponseSchema = t.Object({
  code: t.Number(),
  monitorValue: t.String(),
  monitorTime: t.String()
})

const deviceInfoResponseSchema = t.Object({
  monitorName: t.String(),
  customName: t.String(),
  deviceLocation: t.Object({
    latitude: t.String(),
    longtitude: t.String()
  })
})

const deviceRegisterResponseSchema = t.Object({
  code: t.Number(),
  message: t.String()
})

const deviceDeleteResponseSchema = t.Object({
  code: t.Number(),
  message: t.String()
})

const deviceRangeResponseSchema = t.Object({
  code: t.Number(),
  data: t.Array(
    t.Object({
      monitorValue: t.String(),
      monitorTime: t.String()
    })
  )
})

const getBearerToken = (authHeader?: string) => {
  if (!authHeader) return null
  const [scheme, token] = authHeader.split(' ')
  if (scheme !== 'Bearer' || !token) return null
  return token
}

const deviceBatchRangeResponseSchema = t.Object({
  code: t.Number(),
  data: t.Array(
    t.Object({
      deviceId: t.String(),
      data: t.Array(
        t.Object({
          monitorValue: t.String(),
          monitorTime: t.String()
        })
      )
    })
  )
})

const toGmtPlus7String = (timestamp: number) => {
  const ms = timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp
  const shifted = new Date(ms + 7 * 60 * 60 * 1000)
  const pad = (value: number) => String(value).padStart(2, '0')

  return `${shifted.getUTCFullYear()}-${pad(
    shifted.getUTCMonth() + 1
  )}-${pad(shifted.getUTCDate())} ${pad(
    shifted.getUTCHours()
  )}:${pad(shifted.getUTCMinutes())}:${pad(shifted.getUTCSeconds())}`
}

export const deviceRoutes = new Elysia({
  prefix: '/api/v2/device'
})
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET ?? 'change-me'
    })
  )
  .post(
    '/register',
    async ({ body, headers, jwt }) => {
      const token = getBearerToken(headers.authorization)

      if (!token) {
        return {
          code: 401,
          message: 'Missing Authorization header'
        }
      }

      const payload = await jwt.verify(token).catch(() => null)

      if (!payload || typeof payload.id !== 'number') {
        return {
          code: 401,
          message: 'Invalid or expired token'
        }
      }

      const database = await db
      const {
        deviceId,
        deviceSecretKey,
        monitorItem,
        customName,
        deviceLocation
      } = body

      const existing = await database
        .select()
        .from(devices)
        .where(eq(devices.deviceId, deviceId))
        .limit(1)

      let deviceRecord = existing[0]

      if (deviceRecord) {
        const storedKey = deviceRecord.deviceKey ?? ''
        let validKey = false
        let normalizedKey: string | null = null

        if (!validKey) {
          return {
            code: 401,
            message: 'Invalid device secret'
          }
        }

        if (normalizedKey && normalizedKey !== storedKey) {
          await database
            .update(devices)
            .set({ deviceKey: normalizedKey })
            .where(eq(devices.id, deviceRecord.id))
        }
      } else {
        await database.insert(devices).values({
          deviceId: deviceId,
          deviceKey: deviceSecretKey,
          monitorItem,
          customName: customName ?? null,
          deviceName: null,
          latitude: deviceLocation?.latitude ?? null,
          longitude: deviceLocation?.longtitude ?? null
        })

        const created = await database
          .select()
          .from(devices)
          .where(eq(devices.deviceId, deviceId))
          .limit(1)

        deviceRecord = created[0]

        if (!deviceRecord) {
          return {
            code: 500,
            message: 'Failed to register device'
          }
        }
      }

      const ownership = await database
        .select()
        .from(deviceOwners)
        .where(
          and(
            eq(deviceOwners.userId, payload.id),
            eq(deviceOwners.deviceId, deviceRecord.id)
          )
        )
        .limit(1)

      if (ownership.length === 0) {
        await database.insert(deviceOwners).values({
          userId: payload.id,
          deviceId: deviceRecord.id
        })
      }

      return {
        code: 200,
        message: 'ok'
      }
    },
    {
      headers: t.Object({
        authorization: t.String()
      }),
      body: t.Object({
        deviceId: t.String(),
        deviceSecretKey: t.String(),
        monitorItem: t.String(),
        customName: t.Optional(t.String()),
        deviceLocation: t.Optional(
          t.Object({
            latitude: t.String(),
            longtitude: t.String()
          })
        )
      }),
      response: deviceRegisterResponseSchema
    }
  )
  .post(
    '/info',
    async ({ body, headers, jwt, set }) => {
      const token = getBearerToken(headers.authorization)

      if (!token) {
        set.status = 401
        return {
          monitorName: '',
          customName: '',
          deviceLocation: {
            latitude: '',
            longtitude: ''
          }
        }
      }

      const payload = await jwt.verify(token).catch(() => null)

      if (!payload || typeof payload.id !== 'number') {
        set.status = 401
        return {
          monitorName: '',
          customName: '',
          deviceLocation: {
            latitude: '',
            longtitude: ''
          }
        }
      }

      const database = await db
      const { deviceId } = body

      const deviceRecords = await database
        .select()
        .from(devices)
        .where(eq(devices.deviceId, deviceId))
        .limit(1)

      const deviceRecord = deviceRecords[0]

      if (!deviceRecord) {
        set.status = 404
        return {
          monitorName: '',
          customName: '',
          deviceLocation: {
            latitude: '',
            longtitude: ''
          }
        }
      }

      const ownership = await database
        .select()
        .from(deviceOwners)
        .where(
          and(
            eq(deviceOwners.userId, payload.id),
            eq(deviceOwners.deviceId, deviceRecord.id)
          )
        )
        .limit(1)

      if (ownership.length === 0) {
        set.status = 403
        return {
          monitorName: '',
          customName: '',
          deviceLocation: {
            latitude: '',
            longtitude: ''
          }
        }
      }

      return {
        monitorName: deviceRecord.monitorItem ?? '',
        customName: deviceRecord.customName ?? '',
        deviceLocation: {
          latitude: deviceRecord.latitude ?? '',
          longtitude: deviceRecord.longitude ?? ''
        }
      }
    },
    {
      headers: t.Object({
        authorization: t.String()
      }),
      body: t.Object({
        deviceId: t.String()
      }),
      response: deviceInfoResponseSchema
    }
  )
  .delete(
    '/',
    async ({ body, headers, jwt }) => {
      const token = getBearerToken(headers.authorization)

      if (!token) {
        return {
          code: 401,
          message: 'Missing Authorization header'
        }
      }

      const payload = await jwt.verify(token).catch(() => null)

      if (!payload || typeof payload.id !== 'number') {
        return {
          code: 401,
          message: 'Invalid or expired token'
        }
      }

      const database = await db
      const { deviceId } = body

      const deviceRecords = await database
        .select()
        .from(devices)
        .where(eq(devices.deviceId, deviceId))
        .limit(1)

      const deviceRecord = deviceRecords[0]

      if (!deviceRecord) {
        return {
          code: 404,
          message: 'Device not found'
        }
      }

      const ownership = await database
        .select()
        .from(deviceOwners)
        .where(
          and(
            eq(deviceOwners.userId, payload.id),
            eq(deviceOwners.deviceId, deviceRecord.id)
          )
        )
        .limit(1)

      if (ownership.length === 0) {
        return {
          code: 403,
          message: 'Forbidden'
        }
      }

      await database
        .delete(deviceOwners)
        .where(
          and(
            eq(deviceOwners.userId, payload.id),
            eq(deviceOwners.deviceId, deviceRecord.id)
          )
        )

      const remainingOwners = await database
        .select()
        .from(deviceOwners)
        .where(eq(deviceOwners.deviceId, deviceRecord.id))
        .limit(1)

      if (remainingOwners.length === 0) {
        const deviceRecordDeviceId = deviceRecord.deviceId

        if (!deviceRecordDeviceId) {
          return {
            code: 500,
            message: 'Device record is missing a deviceId'
          }
        }

        await database
          .delete(deviceData)
          .where(eq(deviceData.deviceId, deviceRecordDeviceId))

        await database
          .delete(deviceOwners)
          .where(eq(deviceOwners.deviceId, deviceRecord.id))

        await database.delete(devices).where(eq(devices.id, deviceRecord.id))
      }

      return {
        code: 200,
        message: 'ok'
      }
    },
    {
      headers: t.Object({
        authorization: t.String()
      }),
      body: t.Object({
        deviceId: t.String()
      }),
      response: deviceDeleteResponseSchema
    }
  )
  .post(
    '/',
    async ({ body }) => {
      const database = await db
      const { deviceId, start, end } = body

      const startTime = Math.min(start, end)
      const endTime = Math.max(start, end)
      const startGmtPlus7 = toGmtPlus7String(startTime)
      const endGmtPlus7 = toGmtPlus7String(endTime)

      const rows = await database
        .select({
          monitorValue: deviceData.monitorValue,
          monitorTime: deviceData.monitorTime
        })
        .from(deviceData)
        .where(
          sql`${deviceData.deviceId} = ${deviceId} AND ${
            deviceData.monitorTime
          } BETWEEN ${startGmtPlus7} AND ${endGmtPlus7}`
        )
        .orderBy(deviceData.monitorTime)

      return {
        code: 200,
        data: rows.map((row) => ({
          monitorValue: row.monitorValue ?? '',
          monitorTime: row.monitorTime ?? ''
        }))
      }
    },
    {
      body: t.Object({
        deviceId: t.String(),
        deviceSecretKey: t.String(),
        monitorItem: t.String(),
        start: t.Number(),
        end: t.Number()
      }),
      response: deviceRangeResponseSchema
    }
  )
  .post(
    '/batch',
    async ({ body }) => {
      const database = await db
      const { start, end } = body
      const startTime = Math.min(start, end)
      const endTime = Math.max(start, end)
      const startGmtPlus7 = toGmtPlus7String(startTime)
      const endGmtPlus7 = toGmtPlus7String(endTime)

      const results = await Promise.all(
        body.deviceList.map(async (device) => {
          const rows = await database
            .select({
              monitorValue: deviceData.monitorValue,
              monitorTime: deviceData.monitorTime
            })
            .from(deviceData)
            .where(
              sql`${deviceData.deviceId} = ${device.deviceId} AND ${
                deviceData.monitorTime
              } BETWEEN ${startGmtPlus7} AND ${endGmtPlus7}`
            )
            .orderBy(deviceData.monitorTime)

          return {
            deviceId: device.deviceId,
            data: rows.map((row) => ({
              monitorValue: row.monitorValue ?? '',
              monitorTime: row.monitorTime ?? ''
            }))
          }
        })
      )

      return {
        code: 200,
        data: results
      }
    },
    {
      body: t.Object({
        deviceList: t.Array(
          t.Object({
            deviceId: t.String(),
            deviceSecretKey: t.String(),
            monitorItem: t.String()
          })
        ),
        start: t.Number(),
        end: t.Number()
      }),
      response: deviceBatchRangeResponseSchema
    }
  )
  .post(
    '/latest',
    async ({ body }) => {
      const baseUrl = process.env.MAIN_STREAM_URL

      if (!baseUrl) {
        return {
          code: 500,
          monitorValue: '',
          monitorTime: ''
        }
      }

      const response = await fetch(`${baseUrl}/latest`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(body)
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
    },
    {
      body: t.Object({
        deviceId: t.String(),
        deviceSecretKey: t.String(),
        monitorItem: t.String()
      }),
      response: deviceLatestResponseSchema
    }
  )
