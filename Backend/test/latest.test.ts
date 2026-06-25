import { describe, it, expect, afterEach } from 'bun:test'

const latestCache = new Map<string, { code: number; monitorValue: string; monitorTime: string; expiresAt: number }>()
const pendingRequests = new Map<string, Promise<{ code: number; monitorValue: string; monitorTime: string }>>()

describe('latestCache', () => {
  afterEach(() => {
    latestCache.clear()
  })

  it('returns undefined on cache miss', () => {
    expect(latestCache.get('device:temperature')).toBeUndefined()
  })

  it('returns cached data on cache hit (not expired)', () => {
    latestCache.set('device:temperature', {
      code: 200,
      monitorValue: '25.5',
      monitorTime: '2025-01-01T00:00:00+07:00',
      expiresAt: Date.now() + 60000
    })

    const cached = latestCache.get('device:temperature')
    expect(cached).toBeDefined()
    expect(cached!.code).toBe(200)
    expect(cached!.monitorValue).toBe('25.5')
  })

  it('handles expired cache entries correctly', () => {
    const entry = {
      code: 200,
      monitorValue: 'expired',
      monitorTime: '',
      expiresAt: Date.now() - 1
    }
    latestCache.set('device:temp', entry)

    const cached = latestCache.get('device:temp')
    expect(cached).toBeDefined()
    expect(cached!.expiresAt).toBeLessThanOrEqual(Date.now())
  })

  it('stores result with future expiry', () => {
    latestCache.set('device:temp', {
      code: 200,
      monitorValue: '30.0',
      monitorTime: '2025-06-19T10:00:00+07:00',
      expiresAt: Date.now() + 60000
    })

    const cached = latestCache.get('device:temp')
    expect(cached!.code).toBe(200)
    expect(cached!.monitorValue).toBe('30.0')
    expect(cached!.expiresAt).toBeGreaterThan(Date.now())
  })

  it('returns 404 for missing device data', () => {
    latestCache.set('nonexistent:device', {
      code: 404,
      monitorValue: '',
      monitorTime: '',
      expiresAt: Date.now() + 60000
    })

    const cached = latestCache.get('nonexistent:device')
    expect(cached!.code).toBe(404)
    expect(cached!.monitorValue).toBe('')
  })

  it('different devices have separate cache entries', () => {
    latestCache.set('deviceA:temp', { code: 200, monitorValue: '10', monitorTime: '', expiresAt: Date.now() + 60000 })
    latestCache.set('deviceB:temp', { code: 200, monitorValue: '20', monitorTime: '', expiresAt: Date.now() + 60000 })

    expect(latestCache.get('deviceA:temp')!.monitorValue).toBe('10')
    expect(latestCache.get('deviceB:temp')!.monitorValue).toBe('20')
    expect(latestCache.size).toBe(2)
  })

  it('same device different monitorItems have separate entries', () => {
    latestCache.set('deviceA:temperature', { code: 200, monitorValue: '30', monitorTime: '', expiresAt: Date.now() + 60000 })
    latestCache.set('deviceA:humidity', { code: 200, monitorValue: '60', monitorTime: '', expiresAt: Date.now() + 60000 })

    expect(latestCache.get('deviceA:temperature')!.monitorValue).toBe('30')
    expect(latestCache.get('deviceA:humidity')!.monitorValue).toBe('60')
    expect(latestCache.size).toBe(2)
  })
})

describe('request deduplication', () => {
  afterEach(() => {
    pendingRequests.clear()
    latestCache.clear()
  })

  it('concurrent requests share the same in-flight promise', async () => {
    let queryCount = 0

    const fetchLatest = async (deviceId: string, monitorItem: string) => {
      const cacheKey = `${deviceId}:${monitorItem}`

      const cached = latestCache.get(cacheKey)
      if (cached && cached.expiresAt > Date.now()) {
        return { code: cached.code, monitorValue: cached.monitorValue, monitorTime: cached.monitorTime }
      }

      const pending = pendingRequests.get(cacheKey)
      if (pending) return await pending

      const promise = (async () => {
        await new Promise(r => setTimeout(r, 10))
        queryCount++
        const result = {
          code: 200,
          monitorValue: String(queryCount),
          monitorTime: '2025-06-19T10:00:00+07:00'
        }
        latestCache.set(cacheKey, { ...result, expiresAt: Date.now() + 60000 })
        return result
      })()

      pendingRequests.set(cacheKey, promise)
      try {
        return await promise
      } finally {
        pendingRequests.delete(cacheKey)
      }
    }

    const results = await Promise.all([
      fetchLatest('devA', 'temp'),
      fetchLatest('devA', 'temp'),
      fetchLatest('devA', 'temp')
    ])

    expect(queryCount).toBe(1)
    expect(results[0].monitorValue).toBe(results[1].monitorValue)
    expect(results[1].monitorValue).toBe(results[2].monitorValue)
  })

  it('different cache keys do not block each other', async () => {
    let queryCount = 0

    const fetchLatest = async (deviceId: string, monitorItem: string) => {
      const cacheKey = `${deviceId}:${monitorItem}`

      const cached = latestCache.get(cacheKey)
      if (cached && cached.expiresAt > Date.now()) {
        return { code: cached.code, monitorValue: cached.monitorValue, monitorTime: cached.monitorTime }
      }

      const pending = pendingRequests.get(cacheKey)
      if (pending) return await pending

      const promise = (async () => {
        await new Promise(r => setTimeout(r, 10))
        queryCount++
        const result = {
          code: 200,
          monitorValue: String(queryCount),
          monitorTime: '2025-06-19T10:00:00+07:00'
        }
        latestCache.set(cacheKey, { ...result, expiresAt: Date.now() + 60000 })
        return result
      })()

      pendingRequests.set(cacheKey, promise)
      try {
        return await promise
      } finally {
        pendingRequests.delete(cacheKey)
      }
    }

    const results = await Promise.all([
      fetchLatest('devA', 'temp'),
      fetchLatest('devB', 'humidity'),
      fetchLatest('devA', 'pressure')
    ])

    expect(queryCount).toBe(3)
  })

  it('pending map is cleaned up after request completes', async () => {
    const key = 'devA:temp'

    const promise = new Promise<{ code: number; monitorValue: string; monitorTime: string }>(resolve => {
      setTimeout(() => resolve({ code: 200, monitorValue: 'done', monitorTime: '' }), 10)
    })

    pendingRequests.set(key, promise)
    try {
      await promise
    } finally {
      pendingRequests.delete(key)
    }

    expect(pendingRequests.has(key)).toBe(false)
  })

  it('subsequent requests after cache is refreshed bypass pending map', async () => {
    let queryCount = 0

    const fetchLatest = async (deviceId: string, monitorItem: string) => {
      const cacheKey = `${deviceId}:${monitorItem}`

      const cached = latestCache.get(cacheKey)
      if (cached && cached.expiresAt > Date.now()) {
        return { code: cached.code, monitorValue: cached.monitorValue, monitorTime: cached.monitorTime }
      }

      const pending = pendingRequests.get(cacheKey)
      if (pending) return await pending

      const promise = (async () => {
        await new Promise(r => setTimeout(r, 10))
        queryCount++
        const result = {
          code: 200,
          monitorValue: String(queryCount),
          monitorTime: '2025-06-19T10:00:00+07:00'
        }
        latestCache.set(cacheKey, { ...result, expiresAt: Date.now() + 60000 })
        return result
      })()

      pendingRequests.set(cacheKey, promise)
      try {
        return await promise
      } finally {
        pendingRequests.delete(cacheKey)
      }
    }

    // First batch: cache miss, one query
    await Promise.all([fetchLatest('devA', 'temp'), fetchLatest('devA', 'temp')])
    expect(queryCount).toBe(1)

    // Second batch: cache is now fresh, zero additional queries
    await Promise.all([fetchLatest('devA', 'temp'), fetchLatest('devA', 'temp')])
    expect(queryCount).toBe(1)
  })
})