import dayjs, {
  ConfigType, Dayjs 
} from "dayjs"
import utc from "dayjs/plugin/utc"
import weekOfYear from "dayjs/plugin/weekOfYear"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore"
import "dayjs/locale/da"

dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)
dayjs.extend(utc)
dayjs.extend(weekOfYear)
dayjs.locale("da")

export type Date = Dayjs

export class DateHelper {
  static new(config?: ConfigType): Date {
    return dayjs(config)
  }

  static utc(config?: ConfigType): Date {
    return dayjs.utc(config)
  }
}
