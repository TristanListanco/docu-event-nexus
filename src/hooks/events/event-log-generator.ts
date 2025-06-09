
import { EventType } from "@/types/models";

export const generateLogId = (eventType: EventType): string => {
  // Create ID in format "CCSEVNT-TYPE-MONTH-DAY-YEAR"
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const day = String(now.getDate()).padStart(2, '0');
  const year = now.getFullYear();
  
  // Get type code
  let typeCode;
  switch(eventType) {
    case "General": typeCode = "01"; break;
    case "SPECOM": typeCode = "02"; break;
    case "LITCOM": typeCode = "03"; break;
    case "CUACOM": typeCode = "04"; break;
    case "SPODACOM": typeCode = "05"; break;
    default: typeCode = "01"; // Default to General
  }
  
  return `CCSEVNT-${typeCode}-${month}-${day}-${year}`;
};
