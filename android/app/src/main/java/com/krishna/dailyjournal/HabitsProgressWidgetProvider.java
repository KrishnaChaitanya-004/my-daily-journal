package com.krishna.dailyjournal;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.util.Log;
import android.widget.RemoteViews;

public class HabitsProgressWidgetProvider extends AppWidgetProvider {

    private static final String TAG = "HabitsProgressWidget";

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
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_habits_progress);

            // Apply theme accent color
            int accent = WidgetPrefs.getWidgetThemeColor(context, 0xFF7C3AED);
            try {
                views.setInt(R.id.widget_accent, "setBackgroundColor", accent);
            } catch (Exception e) {
                Log.w(TAG, "Could not set accent color", e);
            }

            int completed = WidgetPrefs.getHabitsCompleted(context);
            int total = WidgetPrefs.getHabitsTotal(context);

            views.setTextViewText(R.id.progress_count, completed + "/" + total);
            views.setTextViewText(R.id.progress_label, "Tap to view");

            int pct = (total > 0) ? Math.round((completed * 100f) / total) : 0;
            views.setProgressBar(R.id.progress_ring, 100, pct, false);

            // Create intent to open habits page
            Intent intent = new Intent(context, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            intent.putExtra("openHabits", true);

            PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                300,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            views.setOnClickPendingIntent(R.id.widget_habits_progress, pendingIntent);

            appWidgetManager.updateAppWidget(appWidgetId, views);
        } catch (Exception e) {
            Log.e(TAG, "Error updating widget", e);
        }
    }
}
