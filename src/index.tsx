import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { useTranslation } from 'react-i18next'
import { bitable, FieldType, INumberFieldMeta } from '@lark-base-open/js-sdk'
import { ConfigProvider, Form, Button, Select, Row, Col, Radio } from 'antd'
import gcoord from 'gcoord'
import { useTheme, useAntdLocale } from './hooks'
import './i18n/i18n'

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
  const { t } = useTranslation()

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
      <p style={{ fontSize: 16, fontWeight: 600 }}>{t('input.coordinates.desc')}</p>
      <Row justify="space-between" gutter={20}>
        <Col span={12}>
          <Form.Item
            required
            label={t('input.coordinates.longitude')}
            name="inputLongitude"
            rules={[
              {
                required: true,
                message: t('placeholder.longitude'),
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
            label={t('input.coordinates.latitude')}
            rules={[
              {
                required: true,
                message: t('placeholder.latitude'),
              },
            ]}
          >
            <Select allowClear style={{ width: '100%' }} options={formatFieldMetaList(numberMetaList)} />
          </Form.Item>
        </Col>
      </Row>
      <p style={{ fontSize: 16, fontWeight: 600 }}>{t('input.coordinates.from')}</p>
      <Form.Item
        name="mapType"
        required
        rules={[
          {
            required: true,
            message: t('placeholder.from'),
          },
        ]}
      >
        <Radio.Group>
          <Radio value="AMap">{t('from.gaode')}</Radio>
          <Radio value="Baidu">{t('from.baidu')}</Radio>
          <Radio value="QQ">{t('from.tencent')}</Radio>
          <Radio value="Google">{t('from.google')}</Radio>
        </Radio.Group>
      </Form.Item>
      <p style={{ fontSize: 16, fontWeight: 600 }}>{t('input.coordinates.to')}</p>
      <Row justify="space-between" gutter={20}>
        <Col span={12}>
          <Form.Item
            label={t('output.coordinates.longitude')}
            required
            name="outputLongitude"
            rules={[
              {
                required: true,
                message: t('placeholder.longitude'),
              },
            ]}
          >
            <Select allowClear style={{ width: '100%' }} options={formatFieldMetaList(numberMetaList)} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={t('output.coordinates.latitude')}
            name="outputLatitude"
            required
            rules={[
              {
                required: true,
                message: t('placeholder.latitude')
              },
            ]}
          >
            <Select allowClear style={{ width: '100%' }} options={formatFieldMetaList(numberMetaList)} />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item>
        <Button type="primary" htmlType="submit">
          {t('btn.translate')}
        </Button>
        <p>{t('btn.desc')}</p>
      </Form.Item>
    </Form>
  )
}
