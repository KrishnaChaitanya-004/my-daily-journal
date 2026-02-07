package com.krishna.dailyjournal;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.util.Log;
import android.widget.RemoteViews;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;
import java.util.Map;

public class CalendarWidgetProvider extends AppWidgetProvider {

    private static final String TAG = "CalendarWidget";

    // Cell IDs for each row/column - must match layout
    private static final int[][] CELL_IDS = {
        {R.id.cell_0_0, R.id.cell_0_1, R.id.cell_0_2, R.id.cell_0_3, R.id.cell_0_4, R.id.cell_0_5, R.id.cell_0_6},
        {R.id.cell_1_0, R.id.cell_1_1, R.id.cell_1_2, R.id.cell_1_3, R.id.cell_1_4, R.id.cell_1_5, R.id.cell_1_6},
        {R.id.cell_2_0, R.id.cell_2_1, R.id.cell_2_2, R.id.cell_2_3, R.id.cell_2_4, R.id.cell_2_5, R.id.cell_2_6},
        {R.id.cell_3_0, R.id.cell_3_1, R.id.cell_3_2, R.id.cell_3_3, R.id.cell_3_4, R.id.cell_3_5, R.id.cell_3_6},
        {R.id.cell_4_0, R.id.cell_4_1, R.id.cell_4_2, R.id.cell_4_3, R.id.cell_4_4, R.id.cell_4_5, R.id.cell_4_6},
        {R.id.cell_5_0, R.id.cell_5_1, R.id.cell_5_2, R.id.cell_5_3, R.id.cell_5_4, R.id.cell_5_5, R.id.cell_5_6}
    };

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        updateAll(context, appWidgetManager, appWidgetIds);
    }

    public static void updateAll(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        try {
            // Ensure midnight refresh is scheduled
            WidgetAlarmScheduler.scheduleNextMidnightRefresh(context);

            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_calendar);

            // Get theme accent color
            int accent = WidgetDataReader.getWidgetThemeColor(context, 0xFF7C3AED);

            // Apply accent to the bar
            try {
                views.setInt(R.id.widget_accent, "setBackgroundColor", accent);
            } catch (Exception e) {
                Log.w(TAG, "Could not set accent color", e);
            }

            // Get current date info
            Calendar now = Calendar.getInstance();
            int currentYear = now.get(Calendar.YEAR);
            int currentMonth = now.get(Calendar.MONTH);
            int currentDay = now.get(Calendar.DAY_OF_MONTH);

            // Set month name (short)
            SimpleDateFormat monthFormat = new SimpleDateFormat("MMM", Locale.getDefault());
            String monthName = monthFormat.format(now.getTime()).toUpperCase();
            views.setTextViewText(R.id.calendar_month, monthName);

            // Set streak with fire emoji
            int streak = WidgetDataReader.getStatsStreak(context);
            views.setTextViewText(R.id.calendar_streak, "🔥" + streak);

            // Set date and day
            SimpleDateFormat dateFormat = new SimpleDateFormat("dd-MM-yyyy EEE", Locale.getDefault());
            String dateDay = dateFormat.format(now.getTime()).toUpperCase();
            views.setTextViewText(R.id.calendar_date_day, dateDay);

            // Get calendar data for the month
            Map<String, int[]> calendarData = WidgetDataReader.getCalendarData(context, currentYear, currentMonth);

            // Calculate first day of month and days in month
            Calendar firstOfMonth = Calendar.getInstance();
            firstOfMonth.set(currentYear, currentMonth, 1);
            
            // Week starts on Saturday (index 0)
            // Java Calendar: SATURDAY=7, SUNDAY=1, MONDAY=2, etc.
            int firstDayOfWeek = firstOfMonth.get(Calendar.DAY_OF_WEEK);
            // Convert to our grid: SAT=0, SUN=1, MON=2, TUE=3, WED=4, THU=5, FRI=6
            int startOffset;
            if (firstDayOfWeek == Calendar.SATURDAY) {
                startOffset = 0;
            } else {
                startOffset = firstDayOfWeek; // SUNDAY=1, MONDAY=2, etc.
            }

            int daysInMonth = firstOfMonth.getActualMaximum(Calendar.DAY_OF_MONTH);

            // Cell size for rendering
            int cellSizeDp = 28;

            // Render each cell
            int dayCounter = 1;
            for (int row = 0; row < 6; row++) {
                for (int col = 0; col < 7; col++) {
                    int cellIndex = row * 7 + col;
                    int dayNumber = 0;
                    int habitProgress = 0;
                    boolean hasEntry = false;
                    boolean isToday = false;

                    if (cellIndex >= startOffset && dayCounter <= daysInMonth) {
                        dayNumber = dayCounter;
                        isToday = (dayCounter == currentDay);

                        // Get data for this day
                        String dateKey = String.format(Locale.US, "%04d-%02d-%02d", currentYear, currentMonth + 1, dayCounter);
                        int[] data = calendarData.get(dateKey);
                        if (data != null) {
                            habitProgress = data[0]; // 0-100
                            hasEntry = data[1] == 1;
                        }

                        dayCounter++;
                    }

                    // Render cell bitmap
                    android.graphics.Bitmap cellBitmap = CalendarCellRenderer.render(
                        context, 
                        cellSizeDp, 
                        dayNumber, 
                        habitProgress, 
                        hasEntry, 
                        isToday, 
                        accent
                    );

                    views.setImageViewBitmap(CELL_IDS[row][col], cellBitmap);
                }
            }

            // Create intent to open app on tap
            Intent intent = new Intent(context, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

            PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                400, // unique request code
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            views.setOnClickPendingIntent(R.id.widget_calendar, pendingIntent);

            appWidgetManager.updateAppWidget(appWidgetId, views);
            Log.d(TAG, "Calendar widget updated successfully");

        } catch (Exception e) {
            Log.e(TAG, "Error updating calendar widget", e);
        }
    }
}
