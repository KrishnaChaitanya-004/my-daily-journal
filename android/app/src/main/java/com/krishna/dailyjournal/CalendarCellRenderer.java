package com.krishna.dailyjournal;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.Typeface;

/**
 * Renders individual calendar day cells as bitmaps for RemoteViews.
 * Each cell can display:
 * - Day number
 * - Habit progress ring around the number
 * - Single diagonal slash for days with diary entries
 */
public final class CalendarCellRenderer {
    private CalendarCellRenderer() {}

    public static Bitmap render(Context context, int sizeDp, int dayNumber, int habitProgress, 
                                 boolean hasEntry, boolean isToday, int accentColor) {
        float density = context.getResources().getDisplayMetrics().density;
        int sizePx = Math.max(1, Math.round(sizeDp * density));

        Bitmap bmp = Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bmp);

        if (dayNumber <= 0) {
            return bmp;
        }

        float centerX = sizePx / 2f;
        float centerY = sizePx / 2f;
        float radius = sizePx * 0.42f;
        float strokeWidth = sizePx * 0.12f;

        // Draw habit progress ring (background track)
        Paint ringBg = new Paint(Paint.ANTI_ALIAS_FLAG);
        ringBg.setStyle(Paint.Style.STROKE);
        ringBg.setStrokeWidth(strokeWidth);
        ringBg.setColor(0xFF3A3A3A);

        RectF oval = new RectF(
            centerX - radius,
            centerY - radius,
            centerX + radius,
            centerY + radius
        );
        
        canvas.drawArc(oval, 0, 360, false, ringBg);
        
        // Draw habit progress ring (foreground arc)
        if (habitProgress > 0) {
            Paint ringFg = new Paint(Paint.ANTI_ALIAS_FLAG);
            ringFg.setStyle(Paint.Style.STROKE);
            ringFg.setStrokeWidth(strokeWidth);
            ringFg.setColor(accentColor);
            ringFg.setStrokeCap(Paint.Cap.ROUND);
            
            int clamped = Math.max(0, Math.min(100, habitProgress));
            float sweep = (360f * clamped) / 100f;
            canvas.drawArc(oval, 270f, sweep, false, ringFg);
        }

        // Draw day number (no today highlight)
        Paint textPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        textPaint.setColor(0xFFE0E0E0);
        textPaint.setTextSize(sizePx * 0.32f);
        textPaint.setTextAlign(Paint.Align.CENTER);
        textPaint.setTypeface(Typeface.DEFAULT);
        
        Paint.FontMetrics fm = textPaint.getFontMetrics();
        float textY = centerY - (fm.ascent + fm.descent) / 2f;
        
        canvas.drawText(String.valueOf(dayNumber), centerX, textY, textPaint);

        // Draw single clean diagonal slash for diary entries
        if (hasEntry) {
            float slashLen = radius * 0.6f;
            
            Paint slashPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            slashPaint.setStyle(Paint.Style.STROKE);
            slashPaint.setStrokeWidth(sizePx * 0.06f);
            slashPaint.setColor(accentColor);
            slashPaint.setStrokeCap(Paint.Cap.ROUND);
            
            // Single diagonal line from top-right to bottom-left
            canvas.drawLine(
                centerX + slashLen, 
                centerY - slashLen,
                centerX - slashLen, 
                centerY + slashLen,
                slashPaint
            );
        }

        return bmp;
    }
}
