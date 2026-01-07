declare module "moment-hijri" {
  import { Moment } from "moment";

  interface MomentHijri extends Moment {
    format(format?: string): string;
    iYear(): number;
    iMonth(): number;
    iDate(): number;
  }

  function momentHijri(
    inp?: string | number | Date | moment.Moment,
    format?: string
  ): MomentHijri;

  namespace momentHijri {
    function locale(language: string): void;
  }

  export = momentHijri;
}
