export type Type = '1' | '2' // 1:校内 2:校外

export interface TodayClass {
  studentId: Student['id'] | null
  time: [string, string] | []
  timeDiff: number
}

export interface Student {
  id: number
  name: string
  type: Type
  crateTime: string
  frequency: number
  frequencyList: TodayClass[]
  disabled: boolean
}

export interface SeriesData {
  value: number
  name: string
  studentId?: number
}
