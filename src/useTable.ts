import useSWR from 'swr'
import { bitable, IRecord } from '@lark-base-open/js-sdk'

export const useTable = () => {
  const { data: tables } = useSWR('/api/table', async () => {
    const tables = await bitable.base.getTableList()
    const tableList = []
    for (const table of tables) {
      const name = await table.getName()
      tableList.push({ label: name, value: table.id })
    }
    return tableList
  })

  return { tables }
}

export const useView = (tableId: string) => {
  const { data: views } = useSWR(tableId ? `/api/view/${tableId}` : null, async () => {
    const table = await bitable.base.getTable(tableId)
    const views = await table.getViewList()
    const viewList = []
    for (const view of views) {
      const name = await view.getName()
      viewList.push({ label: name, value: view.id })
    }
    return viewList
  })
  return { views }
}

export const getRecordList = async (tableId: string, onProgress: ({ progress, duration, total, current }: { progress: number, duration: string, total: number, current: number }) => void, viewId?: string) => {
  const table = await bitable.base.getTable(tableId)
  const allRecords: IRecord[] = []
  let offset = 0
  let hasMore = true
  let total = 0
  const startTime = Date.now() // 记录开始时间

  const fetchRecords = async (offset: number) => {
    return await table.getRecordsByPage({ viewId, pageSize: 200, pageToken: offset })
  }

  while (hasMore) {
    const fetchPromises = Array.from({ length: 5 }, (_, i) => fetchRecords(offset + i * 200)) // 并发执行 5 个请求
    const results = await Promise.all(fetchPromises)
    results.forEach(recordList => {
      allRecords.push(...recordList.records)
      total = recordList.total
    })
    hasMore = results.some(recordList => recordList.hasMore)
    offset += 1000

    // 计算进度和花费的时间
    const progress = Math.round((allRecords.length / total) * 100)
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    onProgress({ progress, duration, total: total, current: allRecords.length }) // 实时返回进度和时间
  }

  return allRecords
}
