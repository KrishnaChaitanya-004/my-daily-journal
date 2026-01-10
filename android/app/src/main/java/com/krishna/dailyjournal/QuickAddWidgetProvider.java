package com.krishna.dailyjournal;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.util.Log;
import android.widget.RemoteViews;

public class QuickAddWidgetProvider extends AppWidgetProvider {

    private static final String TAG = "QuickAddWidget";

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
            // Ensure midnight refresh is scheduled for daily reset
            WidgetAlarmScheduler.scheduleNextMidnightRefresh(context);

            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_quick_add);

            // Apply theme accent color from file-based bridge
            int accent = WidgetDataReader.getWidgetThemeColor(context, 0xFF7C3AED);
            try {
                views.setInt(R.id.widget_accent, "setBackgroundColor", accent);
            } catch (Exception e) {
                Log.w(TAG, "Could not set accent color", e);
            }

            // Add Note button
            Intent noteIntent = new Intent(context, MainActivity.class);
            noteIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            noteIntent.putExtra("openEditor", true);
            noteIntent.putExtra("action", "note");

            PendingIntent notePendingIntent = PendingIntent.getActivity(
                context,
                200,
                noteIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.btn_add_note, notePendingIntent);

            // Add Voice button
            Intent voiceIntent = new Intent(context, MainActivity.class);
            voiceIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            voiceIntent.putExtra("openEditor", true);
            voiceIntent.putExtra("action", "voice");

            PendingIntent voicePendingIntent = PendingIntent.getActivity(
                context,
                201,
                voiceIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.btn_add_voice, voicePendingIntent);

            // Add Task button
            Intent taskIntent = new Intent(context, MainActivity.class);
            taskIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            taskIntent.putExtra("openEditor", true);
            taskIntent.putExtra("action", "task");

            PendingIntent taskPendingIntent = PendingIntent.getActivity(
                context,
                202,
                taskIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.btn_add_task, taskPendingIntent);

            appWidgetManager.updateAppWidget(appWidgetId, views);
        } catch (Exception e) {
            Log.e(TAG, "Error updating widget", e);
        }
    }
}
