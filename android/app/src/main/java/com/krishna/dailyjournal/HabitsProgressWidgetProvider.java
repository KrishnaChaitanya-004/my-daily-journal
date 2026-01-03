package com.krishna.dailyjournal;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

public class HabitsProgressWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_habits_progress);

        // Default progress (will be updated via JS bridge when app syncs)
        views.setTextViewText(R.id.progress_count, "0/0");
        views.setTextViewText(R.id.progress_label, "Tap to view");
        views.setProgressBar(R.id.progress_ring, 100, 0, false);

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
    }
}
