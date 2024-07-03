import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { bitable, FieldType, INumberFieldMeta } from '@lark-base-open/js-sdk'
import { Form, Button, Select, Row, Col, Radio } from 'antd'
import gcoord from 'gcoord'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <LoadApp />
  </React.StrictMode>
)

const mapTypeMapping = {
  AMap: gcoord.AMap,
  Baidu: gcoord.BD09,
  QQ: gcoord.GCJ02,
  Google: gcoord.WGS84,
}

type FormValues = {
  inputLongitude: string
  inputLatitude: string
  outputLongitude: string
  outputLatitude: string
  mapType: keyof typeof mapTypeMapping
}

function LoadApp() {
  const [numberMetaList, setNumberMetaList] = useState<INumberFieldMeta[]>([])
  const [form] = Form.useForm()

  useEffect(() => {
    const fn = async () => {
      const table = await bitable.base.getActiveTable()
      const numberList = await table.getFieldMetaListByType<INumberFieldMeta>(FieldType.Number)
      setNumberMetaList(numberList)
    }
    fn()
  }, [])

  const formatFieldMetaList = (metaList: INumberFieldMeta[]) => {
    return metaList.map((meta) => ({ label: meta.name, value: meta.id }))
  }

  const onTransform = async (values: FormValues) => {
    await form.validateFields()
    const { inputLongitude, inputLatitude, outputLongitude, outputLatitude, mapType } = values
    const table = await bitable.base.getActiveTable()
    const inputLongitudeField = await table.getField(inputLongitude)
    const inputLatitudeField = await table.getField(inputLatitude)
    const outputLongitudeField = await table.getField(outputLongitude)
    const outputLatitudeField = await table.getField(outputLatitude)
    const recordIdList = await table.getRecordIdList()
    for (const recordId of recordIdList) {
      const inputLongitudeValue = await inputLongitudeField.getValue(recordId)
      const inputLatitudeValue = await inputLatitudeField.getValue(recordId)
      if (!inputLongitudeValue || !inputLatitudeValue) continue
      const [lng, lat] = gcoord.transform(
        [inputLongitudeValue, inputLatitudeValue],
        mapTypeMapping[mapType],
        gcoord.WGS84
      )
      await outputLongitudeField.setValue(recordId, lng)
      await outputLatitudeField.setValue(recordId, lat)
    }
  }

  return (
    <Form style={{ padding: 20 }} onFinish={onTransform}>
      <p style={{ fontSize: 16, fontWeight: 600 }}>1. 选择需要转换的经、纬度字段</p>
      <Row justify="space-between" gutter={20}>
        <Col span={12}>
          <Form.Item
            required
            label="经度"
            name="inputLongitude"
            rules={[
              {
                required: true,
                message: '请选择经度字段',
              },
            ]}
          >
            <Select allowClear style={{ width: '100%' }} options={formatFieldMetaList(numberMetaList)} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            required
            name={'inputLatitude'}
            label="纬度"
            rules={[
              {
                required: true,
                message: '请选择经度字段',
              },
            ]}
          >
            <Select allowClear style={{ width: '100%' }} options={formatFieldMetaList(numberMetaList)} />
          </Form.Item>
        </Col>
      </Row>
      <p style={{ fontSize: 16, fontWeight: 600 }}>2. 经纬度数据来自哪里?</p>
      <Form.Item
        name="mapType"
        required
        rules={[
          {
            required: true,
            message: '请选择数据来源',
          },
        ]}
      >
        <Radio.Group>
          <Radio value="AMap">高德地图</Radio>
          <Radio value="Baidu">百度地图</Radio>
          <Radio value="QQ">腾讯地图</Radio>
          <Radio value="Google">谷歌地图</Radio>
        </Radio.Group>
      </Form.Item>
      <p style={{ fontSize: 16, fontWeight: 600 }}>3. 选择输出的经、纬度字段</p>
      <Row justify="space-between" gutter={20}>
        <Col span={12}>
          <Form.Item
            label="经度"
            required
            name="outputLongitude"
            rules={[
              {
                required: true,
                message: '请选择经度字段',
              },
            ]}
          >
            <Select allowClear style={{ width: '100%' }} options={formatFieldMetaList(numberMetaList)} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="纬度"
            name="outputLatitude"
            required
            rules={[
              {
                required: true,
                message: '请选择纬度字段',
              },
            ]}
          >
            <Select allowClear style={{ width: '100%' }} options={formatFieldMetaList(numberMetaList)} />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item>
        <Button type="primary" htmlType="submit">
          转换
        </Button>
        <p>这里输出的坐标系为 WGS84</p>
      </Form.Item>
    </Form>
  )
}
