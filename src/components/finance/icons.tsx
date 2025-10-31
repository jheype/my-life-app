import { IconType } from "react-icons";
import { FaPrescriptionBottleMedical, FaHeart, FaCreditCard, FaCode, FaCat, FaCarSide, FaBrain, FaCapsules, FaCartShopping, FaUtensils, FaGamepad, FaBus, FaHouse, FaMoneyBillWave } from "react-icons/fa6";
import { MdSubscriptions } from "react-icons/md";

export const ICONS: Record<string, IconType> = {
  shopping: FaCartShopping,
  food: FaUtensils,
  gaming: FaGamepad,
  transport: FaBus,
  housing: FaHouse,
  income: FaMoneyBillWave,
  subs: MdSubscriptions,
  brain: FaBrain,
  capsules: FaCapsules,
  carside: FaCarSide,
  cat: FaCat,
  code: FaCode,
  card: FaCreditCard,
  heart: FaHeart,
  medicine: FaPrescriptionBottleMedical,
};

export const ICON_KEYS = Object.keys(ICONS);
