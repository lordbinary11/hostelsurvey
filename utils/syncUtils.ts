import { Survey } from '../types/survey';
import { getSurveysFromSupabase, SupabaseSurvey } from '../services/supabaseService';

export interface SurveyWithSyncStatus extends Survey {
  isSynced: boolean;
  supabaseId?: number;
}

/**
 * Check sync status of local surveys by comparing with Supabase
 */
export const getSurveysWithSyncStatus = async (
  localSurveys: Survey[]
): Promise<SurveyWithSyncStatus[]> => {
  try {
    // Get surveys from Supabase
    const supabaseSurveys = await getSurveysFromSupabase();

    // Create a map of local_id to supabase survey for quick lookup
    const supabaseMap = new Map<number, SupabaseSurvey>();
    supabaseSurveys.forEach((survey) => {
      if (survey.local_id) {
        supabaseMap.set(survey.local_id, survey);
      }
    });

    // Map local surveys with sync status
    return localSurveys.map((survey) => {
      const supabaseSurvey = survey.id ? supabaseMap.get(survey.id) : undefined;
      return {
        ...survey,
        isSynced: !!supabaseSurvey,
        supabaseId: supabaseSurvey?.id,
      };
    });
  } catch (error) {
    console.error('Error checking sync status:', error);
    // If we can't check Supabase, assume all are unsynced
    return localSurveys.map((survey) => ({
      ...survey,
      isSynced: false,
    }));
  }
};

/**
 * Get count of unsynced surveys
 */
export const getUnsyncedCount = async (localSurveys: Survey[]): Promise<number> => {
  const surveysWithStatus = await getSurveysWithSyncStatus(localSurveys);
  return surveysWithStatus.filter((s) => !s.isSynced).length;
};

/**
 * Get unsynced surveys
 */
export const getUnsyncedSurveys = async (localSurveys: Survey[]): Promise<Survey[]> => {
  const surveysWithStatus = await getSurveysWithSyncStatus(localSurveys);
  return surveysWithStatus.filter((s) => !s.isSynced).map((s) => {
    const { isSynced, supabaseId, ...survey } = s;
    return survey;
  });
};

