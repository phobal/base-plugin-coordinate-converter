import { bitable, ThemeModeType, Locale } from "@lark-base-open/js-sdk"
import { useEffect, useState, useCallback } from "react"
import antdZhCN from 'antd/lib/locale/zh_CN'
import antdEnUS from 'antd/lib/locale/en_US'
import { enable as enableDarkMode, disable as disableDarkMode, setFetchMethod } from 'darkreader'

setFetchMethod(window.fetch)

const useTheme = () => {
  const [theme, setTheme] = useState<ThemeModeType>()
  async function getTheme() {
    const theme = await bitable.bridge.getTheme()
    return theme
  }
  const changeTheme = useCallback((mode?: ThemeModeType) => {
    if (mode === ThemeModeType.DARK) {
      enableDarkMode({
        mode: 1,
        brightness: 140,
        contrast: 100,
        sepia: 0,
        darkSchemeBackgroundColor: '#0a0a0a',
        darkSchemeTextColor: '#FFFFFF',
      })
    } else {
      disableDarkMode()
    }
  }, [])
  useEffect(() => {
    getTheme().then((theme) => {
      setTheme(theme)
      changeTheme(theme)
    })
  }, [])

  useEffect(() => {
    bitable.bridge.onThemeChange((e) => {
      setTheme(e?.data?.theme)
      changeTheme(e?.data?.theme)
    })
  }, [])

  return { theme }
}

const useAntdLocale = () => {
  async function getLocale() {
    const locale = await bitable.bridge.getLocale()
    return locale
  }
  const [locale, setLocale] = useState<Locale>()
  useEffect(() => {
    getLocale().then((locale) => {
      setLocale(locale)
    })
  }, [])

  return { locale: locale === 'zh-CN' ? antdZhCN : antdEnUS}
}

export { useTheme, useAntdLocale }