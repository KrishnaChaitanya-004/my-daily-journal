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

public class TodayDiaryWidgetProvider extends AppWidgetProvider {

    private static final String TAG = "TodayDiaryWidget";

    private static final String[] PROMPTS = {
        "What made you smile today?",
        "What are you grateful for?",
        "What's on your mind right now?",
        "How are you feeling today?",
        "What did you learn today?",
        "What are you looking forward to?",
        "Describe your day in three words..."
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
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_today_diary);

            // Apply theme accent color
            int accent = WidgetPrefs.getWidgetThemeColor(context, 0xFF7C3AED);
            try {
                views.setInt(R.id.widget_accent, "setBackgroundColor", accent);
            } catch (Exception e) {
                Log.w(TAG, "Could not set accent color", e);
            }

            // Set current date
            SimpleDateFormat dateFormat = new SimpleDateFormat("EEEE, MMMM d, yyyy", Locale.getDefault());
            String currentDate = dateFormat.format(new Date());
            views.setTextViewText(R.id.widget_date, currentDate);

            // Prefer today's snippet (if app pushed it), otherwise show rotating prompt
            String snippet = WidgetPrefs.getTodaySnippet(context);
            if (snippet != null && snippet.trim().length() > 0) {
                views.setTextViewText(R.id.widget_prompt, snippet);
            } else {
                int promptIndex = (int) (System.currentTimeMillis() / 86400000) % PROMPTS.length;
                views.setTextViewText(R.id.widget_prompt, PROMPTS[promptIndex]);
            }

            // Create intent to open today's diary entry
            Intent intent = new Intent(context, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            intent.putExtra("openEditor", true);
            intent.putExtra("date", new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date()));

            PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                100,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            // Set click listeners
            views.setOnClickPendingIntent(R.id.widget_today_diary, pendingIntent);
            views.setOnClickPendingIntent(R.id.widget_write_button, pendingIntent);

            appWidgetManager.updateAppWidget(appWidgetId, views);
        } catch (Exception e) {
            Log.e(TAG, "Error updating widget", e);
        }
    }
}
