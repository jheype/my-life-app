import { IconType } from "react-icons";
import { FaCartShopping, FaUtensils, FaGamepad, FaBus, FaHouse, FaMoneyBillWave } from "react-icons/fa6";
import { MdSubscriptions } from "react-icons/md";

export const ICONS: Record<string, IconType> = {
  shopping: FaCartShopping,
  food: FaUtensils,
  gaming: FaGamepad,
  transport: FaBus,
  housing: FaHouse,
  income: FaMoneyBillWave,
  subs: MdSubscriptions,
};

export const ICON_KEYS = Object.keys(ICONS);
