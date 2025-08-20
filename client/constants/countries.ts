// constants/countries.ts

export type Country = {
  name: string;
  code: string; // ISO code
  dialCode: string; // Phone prefix
};

// دول الخليج والشرق الأوسط
export const MIDDLE_EAST_COUNTRIES: Country[] = [
  { name: "مصر", code: "EG", dialCode: "+20" },
  { name: "السعودية", code: "SA", dialCode: "+966" },
  { name: "الإمارات", code: "AE", dialCode: "+971" },
  { name: "الكويت", code: "KW", dialCode: "+965" },
  { name: "قطر", code: "QA", dialCode: "+974" },
  { name: "البحرين", code: "BH", dialCode: "+973" },
  { name: "عُمان", code: "OM", dialCode: "+968" },
  { name: "الأردن", code: "JO", dialCode: "+962" },
  { name: "لبنان", code: "LB", dialCode: "+961" },
  { name: "سوريا", code: "SY", dialCode: "+963" },
  { name: "العراق", code: "IQ", dialCode: "+964" },
  { name: "اليمن", code: "YE", dialCode: "+967" },
  { name: "فلسطين", code: "PS", dialCode: "+970" },
  { name: "ليبيا", code: "LY", dialCode: "+218" },
  { name: "السودان", code: "SD", dialCode: "+249" },
];
