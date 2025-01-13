import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider, Form, Button, Select, Row, Col } from 'antd'
import { useTheme, useAntdLocale } from './hooks'
import './i18n/i18n'
import { useTable, useView, getRecordList } from './useTable'
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

function App() {
  useTheme()
  const { locale } = useAntdLocale()
  return (
    <ConfigProvider locale={locale}>
      <LoadApp />
    </ConfigProvider>
  )
}

type FormValues = {
  tableId: string
  viewId: string
}

function LoadApp() {
  const [form] = Form.useForm()
  const tableId = Form.useWatch('tableId', form)
  const { tables } = useTable()
  const { views } = useView(tableId)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState('0')
  const [total, setTotal] = useState(0)
  const [current, setCurrent] = useState(0)

  const onTransform = async (values: FormValues) => {
    await form.validateFields()
    const { tableId, viewId } = values
    setProcessing(true)
    const recordList = await getRecordList(tableId, ({ progress, duration, total, current }) => {
      console.log(`进度: ${progress}%, 耗时: ${duration}秒, 总数: ${total}, 当前: ${current}`)
      setProgress(progress)
      setDuration(duration)
      setTotal(total)
      setCurrent(current)
    }, viewId)
    console.log(recordList)
    setProcessing(false)
  }

  return (
    <Form style={{ padding: 20 }} onFinish={onTransform} form={form}>
      <p style={{ fontSize: 16, fontWeight: 600 }}>性能测试</p>
      <Row justify="space-between" gutter={20}>
        <Col span={12}>
          <Form.Item
            required
            label="选择数据表"
            name="tableId"
            rules={[
              {
                required: true,
                message: '请选择数据表',
              },
            ]}
          >
            <Select allowClear style={{ width: '100%' }} options={tables} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name={'viewId'}
            label={'选择视图'}
          >
            <Select allowClear style={{ width: '100%' }} options={views} />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={processing}>
          获取全部数据
        </Button>
      </Form.Item>
      {total > 0 && <p>总数: {total}</p>}
      {current > 0 && <p>当前: {current}</p>}
      {progress > 0 && <p>进度: {progress}%</p>}
      {duration !== '0' && <p>耗时: {duration}秒</p>}
    </Form>
  )
}
