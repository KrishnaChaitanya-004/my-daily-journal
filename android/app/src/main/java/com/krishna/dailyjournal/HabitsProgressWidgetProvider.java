package com.krishna.dailyjournal;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.util.TypedValue;
import android.widget.RemoteViews;

public class HabitsProgressWidgetProvider extends AppWidgetProvider {

    private static final String TAG = "HabitsProgressWidget";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        updateAll(context, appWidgetManager, appWidgetIds);
    }

    @Override
    public void onAppWidgetOptionsChanged(
        Context context,
        AppWidgetManager appWidgetManager,
        int appWidgetId,
        Bundle newOptions
    ) {
        updateAppWidget(context, appWidgetManager, appWidgetId);
    }

    public static void updateAll(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        try {
            // Ensure midnight refresh is scheduled so daily reset shows even if app is killed.
            WidgetAlarmScheduler.scheduleNextMidnightRefresh(context);

            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_habits_progress);

            int accent = WidgetDataReader.getWidgetThemeColor(context, 0xFF7C3AED);

            // Read habits data from file-based bridge
            int completed = WidgetDataReader.getHabitsCompleted(context);
            int total = WidgetDataReader.getHabitsTotal(context);

            Log.d(TAG, "Widget data: completed=" + completed + ", total=" + total);

            views.setTextViewText(R.id.progress_count, completed + "/" + total);

            int cardSizeDp = getCardSizeDp(appWidgetManager, appWidgetId);
            int ringSizeDp = Math.max(72, cardSizeDp - 24);
            float textSizeSp = Math.max(20f, Math.min(28f, cardSizeDp * 0.18f));
            int strokeDp = Math.max(6, Math.round(ringSizeDp / 14f));

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                views.setViewLayoutWidth(
                    R.id.widget_habits_progress_card,
                    cardSizeDp,
                    TypedValue.COMPLEX_UNIT_DIP
                );
                views.setViewLayoutHeight(
                    R.id.widget_habits_progress_card,
                    cardSizeDp,
                    TypedValue.COMPLEX_UNIT_DIP
                );
                views.setTextViewTextSize(
                    R.id.progress_count,
                    TypedValue.COMPLEX_UNIT_SP,
                    textSizeSp
                );
            }

            int pct = (total > 0) ? Math.round((completed * 100f) / total) : 0;
            // Always render from 0 with the latest computed value (no animation/spin).
            views.setImageViewBitmap(
                R.id.progress_ring_image,
                RingRenderer.render(context, ringSizeDp, strokeDp, pct, accent)
            );

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

            views.setOnClickPendingIntent(R.id.widget_habits_progress_card, pendingIntent);

            appWidgetManager.updateAppWidget(appWidgetId, views);
        } catch (Exception e) {
            Log.e(TAG, "Error updating widget", e);
        }
    }

    private static int getCardSizeDp(AppWidgetManager appWidgetManager, int appWidgetId) {
        Bundle options = appWidgetManager.getAppWidgetOptions(appWidgetId);
        int widthDp = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 120);
        int heightDp = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 120);
        int shortestSideDp = Math.min(widthDp, heightDp);
        return Math.max(96, Math.min(156, shortestSideDp));
    }
}
