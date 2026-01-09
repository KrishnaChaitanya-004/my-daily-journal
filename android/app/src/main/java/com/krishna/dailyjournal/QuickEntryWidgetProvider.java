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

public class QuickEntryWidgetProvider extends AppWidgetProvider {

    private static final String TAG = "QuickEntryWidget";

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
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_quick_entry);

            // Apply theme accent color from file-based bridge
            int accent = WidgetDataReader.getWidgetThemeColor(context, 0xFF7C3AED);
            try {
                views.setInt(R.id.widget_accent, "setBackgroundColor", accent);
            } catch (Exception e) {
                Log.w(TAG, "Could not set accent color", e);
            }

            // Set current date
            SimpleDateFormat dateFormat = new SimpleDateFormat("EEEE, MMMM d, yyyy", Locale.getDefault());
            String currentDate = dateFormat.format(new Date());
            views.setTextViewText(R.id.widget_date, currentDate);

            // Prefer today's snippet from file-based bridge, otherwise show prompt
            String snippet = WidgetDataReader.getTodaySnippet(context);
            if (snippet != null && snippet.trim().length() > 0) {
                views.setTextViewText(R.id.widget_prompt, snippet);
            } else {
                String[] prompts = {
                    "What made you smile today?",
                    "What are you grateful for?",
                    "What's on your mind right now?",
                    "Describe your day in three words...",
                    "What did you learn today?",
                    "What are you looking forward to?",
                    "How are you feeling right now?"
                };
                int promptIndex = (int) (System.currentTimeMillis() / 86400000) % prompts.length;
                views.setTextViewText(R.id.widget_prompt, prompts[promptIndex]);
            }

            // Create intent to open app
            Intent intent = new Intent(context, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            intent.putExtra("openEditor", true);

            PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            // Set click listeners
            views.setOnClickPendingIntent(R.id.widget_quick_entry, pendingIntent);
            views.setOnClickPendingIntent(R.id.widget_button, pendingIntent);

            appWidgetManager.updateAppWidget(appWidgetId, views);
        } catch (Exception e) {
            Log.e(TAG, "Error updating widget", e);
        }
    }
}
