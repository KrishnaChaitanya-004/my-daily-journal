import { syncAllWidgetData } from './syncAllWidgetData';

/**
 * @deprecated Use syncAllWidgetData instead. Kept for backward compatibility.
 */
export const syncCalendarWidget = syncAllWidgetData;

/**
 * Force immediate widget refresh by triggering a full atomic sync.
 * Call after any data change that affects widgets.
 */
export const forceWidgetRefresh = syncAllWidgetData;
