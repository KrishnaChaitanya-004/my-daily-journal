package com.krishna.dailyjournal;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.util.Log;
import android.widget.RemoteViews;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class HabitsWidgetProvider extends AppWidgetProvider {

    private static final String TAG = "HabitsWidget";

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
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_habits);

            // Apply theme accent color
            int accent = WidgetPrefs.getWidgetThemeColor(context, 0xFF7C3AED);
            try {
                views.setInt(R.id.widget_accent, "setBackgroundColor", accent);
            } catch (Exception e) {
                Log.w(TAG, "Could not set accent color", e);
            }

            // Set current date
            SimpleDateFormat dateFormat = new SimpleDateFormat("EEEE, MMMM d", Locale.getDefault());
            String currentDate = dateFormat.format(new Date());
            views.setTextViewText(R.id.habits_date, currentDate);

            // Get habits data from prefs
            int completed = WidgetPrefs.getHabitsCompleted(context);
            int total = WidgetPrefs.getHabitsTotal(context);
            
            if (total > 0) {
                views.setTextViewText(R.id.habit_1, completed + " of " + total + " habits done");
            } else {
                views.setTextViewText(R.id.habit_1, "Tap to view habits");
            }
            
            views.setTextViewText(R.id.habits_progress, completed + "/" + total + " completed");

            // Create intent to open habits page
            Intent intent = new Intent(context, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            intent.putExtra("openHabits", true);

            PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                1,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            views.setOnClickPendingIntent(R.id.widget_habits, pendingIntent);

            appWidgetManager.updateAppWidget(appWidgetId, views);
        } catch (Exception e) {
            Log.e(TAG, "Error updating widget", e);
        }
    }
}
