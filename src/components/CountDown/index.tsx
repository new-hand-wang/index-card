import './style.scss';
import React, { useLayoutEffect, useMemo } from 'react';
import { dashboard, bitable, DashboardState, IConfig } from "@lark-base-open/js-sdk";
import { Button, DatePicker, ConfigProvider, Checkbox, Row, Col, Input, Switch, Radio } from '@douyinfe/semi-ui';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getTime } from './utils';
import { useConfig } from '../../hooks';
import dayjs from 'dayjs';
import classnames from 'classnames'
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next/typescript/t';
import { ColorPicker } from '../ColorPicker';
import { Item } from '../Item';

/** 符合convertTimestamp的日期格式 */
const titleDateReg = /\d{4}-\d{1,2}-\d{1,2}\s\d+:\d+:\d{1,2}/

interface ICountDownConfig {
  color: string;
  /** 毫秒级时间戳 */
  target: number;
  units: string[];
  othersConfig: string[],
  title: string,
  showTitle: boolean,
  /** 指标卡配置 */
  metricValue: string;
  metricTitle: string;
  metricSubtitle: string;
  metricChange: number;
  metricChangeType: 'increase' | 'decrease';
}

const othersConfigKey: { key: string, title: string }[] = []

const defaultOthersConfig = ['showTitle']


const getAvailableUnits: (t: TFunction<"translation", undefined>) => { [p: string]: { title: string, unit: number, order: number } } = (t) => {
  return {
    sec: {
      title: t('second'),
      unit: 1,
      order: 1,
    },
    min: {
      title: t('minute'),
      unit: 60,
      order: 2,
    },
    hour: {
      title: t('hour'),
      unit: 60 * 60,
      order: 3,
    },
    day: {
      title: t('day'),
      unit: 60 * 60 * 24,
      order: 4,
    },
    week: {
      title: t('week'),
      unit: 60 * 60 * 24 * 7,
      order: 5,
    },
    month: {
      title: t('month'),
      unit: 60 * 60 * 24 * 30,
      order: 6,
    },
  }

}

const defaultUnits = ['sec', 'min', 'hour', 'day']

/** 倒计时 */
export default function CountDown(props: { bgColor: string }) {

  const { t, i18n } = useTranslation();

  // create时的默认配置
  const [config, setConfig] = useState<ICountDownConfig>({
    target: new Date().getTime(),
    color: 'var(--ccm-chart-N700)',
    units: defaultUnits,
    title: t('target.remain'),
    showTitle: false,
    othersConfig: defaultOthersConfig,
    metricValue: '63',
    metricTitle: 'AI Projects',
    metricSubtitle: 'Approved',
    metricChange: 25,
    metricChangeType: 'increase'
  })

  const availableUnits = useMemo(() => getAvailableUnits(t), [i18n.language]);

  const isCreate = dashboard.state === DashboardState.Create

  useEffect(() => {
    if (isCreate) {
      setConfig({
        target: new Date().getTime(),
        color: 'var(--ccm-chart-N700)',
        units: defaultUnits,
        title: t('target.remain'),
        showTitle: false,
        othersConfig: defaultOthersConfig,
        metricValue: '63',
        metricTitle: 'AI Projects',
        metricSubtitle: 'Approved',
        metricChange: 25,
        metricChangeType: 'increase'
      })
    }
  }, [i18n.language, isCreate])

  /** 是否配置/创建模式下 */
  const isConfig = dashboard.state === DashboardState.Config || isCreate;

  const timer = useRef<any>()

  /** 配置用户配置 */
  const updateConfig = (res: IConfig) => {
    if (timer.current) {
      clearTimeout(timer.current)
    }
    const { customConfig } = res;
    if (customConfig) {
      setConfig(customConfig as any);
      timer.current = setTimeout(() => {
        //自动化发送截图。 预留3s给浏览器进行渲染，3s后告知服务端可以进行截图了（对域名进行了拦截，此功能仅上架部署后可用）。
        dashboard.setRendered();
      }, 3000);
    }

  }

  useConfig(updateConfig)

  return (
    <main style={{backgroundColor: props.bgColor}} className={classnames({'main-config': isConfig, 'main': true})}>
      <div className='content'>
        <MetricCardView
          t={t}
          availableUnits={availableUnits}
          config={config}
          isConfig={isConfig}
        />
      </div>
      {
        isConfig && <ConfigPanel t={t} config={config} setConfig={setConfig} availableUnits={availableUnits} />
      }
    </main>
  )
}


interface IMetricCardView {
  config: ICountDownConfig,
  isConfig: boolean,
  t: TFunction<"translation", undefined>,
  availableUnits: ReturnType<typeof getAvailableUnits>
}
function MetricCardView({ config, isConfig, t }: IMetricCardView) {
  const { color, metricValue, metricTitle, metricSubtitle, metricChange, metricChangeType } = config

  return (
    <div style={{ width: '100%', textAlign: 'center', overflow: 'hidden', padding: '20px' }}>
      <div className={classnames('metric-card', {
        'metric-card-config': isConfig
      })} style={{ color }}>
        {/* 指标标题 */}
        <div className={classnames('metric-title', {
          'metric-title-config': isConfig
        })}>
          {metricTitle}
        </div>
        {/* 指标值 */}
        <div className={classnames('metric-value', {
          'metric-value-config': isConfig
        })}>
          {metricValue}
        </div>
                
        {/* 指标副标题 */}
        <div className={classnames('metric-subtitle', {
          'metric-subtitle-config': isConfig
        })}>
          {metricSubtitle}
        </div>
        
        {/* 变化趋势 */}
        <div className={classnames('metric-change', {
          'metric-change-config': isConfig,
          'metric-change-increase': metricChangeType === 'increase',
          'metric-change-decrease': metricChangeType === 'decrease'
        })}>
          {metricChangeType === 'increase' ? '↑' : '↓'} {metricChange}%
        </div>
      </div>
    </div>
  );
}

/** 格式化显示时间 */
function convertTimestamp(timestamp: number) {
  return dayjs(timestamp / 1000).format('YYYY-MM-DD HH:mm:ss')
}


function ConfigPanel(props: {
  config: ICountDownConfig,
  setConfig: React.Dispatch<React.SetStateAction<ICountDownConfig>>,
  availableUnits: ReturnType<typeof getAvailableUnits>,
  t: TFunction<"translation", undefined>,
}) {
  const { config, setConfig, availableUnits, t } = props;

  /**保存配置 */
  const onSaveConfig = () => {
    dashboard.saveConfig({
      customConfig: config,
      dataConditions: [],
    } as any)
  }

  return (
    <div className='config-panel'>
      <div className='form'>

        {/* 指标卡配置 */}
        <Item label='指标值'>
          <Input
            value={config.metricValue}
            onChange={(v) => setConfig({
              ...config,
              metricValue: v
            })}
          />
        </Item>

        <Item label='指标标题'>
          <Input
            value={config.metricTitle}
            onChange={(v) => setConfig({
              ...config,
              metricTitle: v
            })}
          />
        </Item>

        <Item label='指标副标题'>
          <Input
            value={config.metricSubtitle}
            onChange={(v) => setConfig({
              ...config,
              metricSubtitle: v
            })}
          />
        </Item>

        <Item label='变化百分比'>
          <Input
            type='number'
            value={config.metricChange}
            onChange={(v) => setConfig({
              ...config,
              metricChange: parseInt(v) || 0
            })}
          />
        </Item>

        <Item label='变化类型'>
          <Radio.Group value={config.metricChangeType} style={{ width: '100%' }} onChange={(v) => {
            setConfig({
              ...config,
              metricChangeType: v as 'increase' | 'decrease'
            })
          }}>
            <div className='checkbox-group'>
              <div className='checkbox-group-item'>
                <Radio value='increase'>上升</Radio>
              </div>
              <div className='checkbox-group-item'>
                <Radio value='decrease'>下降</Radio>
              </div>
            </div>
          </Radio.Group>
        </Item>

        <Item label={t("label.color")}>
          <ColorPicker value={config.color} onChange={(v) => {
            setConfig({
              ...config,
              color: v,
            })
          }}></ColorPicker>
        </Item>

      </div>

      <Button
        className='btn'
        theme='solid'
        onClick={onSaveConfig}
      >
        {t('confirm')}
      </Button>
    </div>
  )
}