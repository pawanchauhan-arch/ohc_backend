export interface JslSurveyDetails {
  Serno: string;
  Tdlnr: string;
  TranName: string;
  VehNo: string;
  OutbInDate: string;
  OutbInTime: string;
  Zdelete: string;
  Tknum: string;
  Drname: string;
  Conno: string;
  Licno: string;
  DrvDOB: string;
  Age: string;
  Gender: string;
}

export interface JslSurveyResponse {
  ZODATA_GE_SURVEY_LMCSet: {
    ZODATA_GE_SURVEY_LMC: JslSurveyDetails;
  };
}

export const isJslSurveyResponse = (candidate: unknown): candidate is JslSurveyResponse => {
  if (typeof candidate !== 'object' || candidate === null) return false;
  const casted = candidate as Record<string, unknown>;
  const lmSet = casted.ZODATA_GE_SURVEY_LMCSet as Record<string, unknown> | undefined;
  if (typeof lmSet !== 'object' || lmSet === null) return false;
  const survey = lmSet.ZODATA_GE_SURVEY_LMC as Record<string, unknown> | undefined;
  return typeof survey === 'object' && survey !== null;
};


