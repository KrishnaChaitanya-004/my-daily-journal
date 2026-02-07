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
 * - Strikethrough slash for days with diary entries
 * - Highlight for today
 */
public final class CalendarCellRenderer {
    private CalendarCellRenderer() {}

    /**
     * Render a calendar day cell.
     *
     * @param context Android context
     * @param sizeDp Cell size in dp
     * @param dayNumber Day of month (1-31), or 0 for empty cell
     * @param habitProgress Habit progress 0-100%
     * @param hasEntry Whether this day has a diary entry (show slash)
     * @param isToday Whether this is today (highlight)
     * @param accentColor Theme accent color
     * @return Bitmap for the cell
     */
    public static Bitmap render(Context context, int sizeDp, int dayNumber, int habitProgress, 
                                 boolean hasEntry, boolean isToday, int accentColor) {
        float density = context.getResources().getDisplayMetrics().density;
        int sizePx = Math.max(1, Math.round(sizeDp * density));

        Bitmap bmp = Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bmp);

        if (dayNumber <= 0) {
            // Empty cell
            return bmp;
        }

        float centerX = sizePx / 2f;
        float centerY = sizePx / 2f;
        float radius = sizePx * 0.38f;
        float strokeWidth = sizePx * 0.08f;

        // Draw habit progress ring (background)
        Paint ringBg = new Paint(Paint.ANTI_ALIAS_FLAG);
        ringBg.setStyle(Paint.Style.STROKE);
        ringBg.setStrokeWidth(strokeWidth);
        ringBg.setColor(0xFF2A2A2A); // dark grey background

        RectF oval = new RectF(
            centerX - radius,
            centerY - radius,
            centerX + radius,
            centerY + radius
        );
        
        if (habitProgress > 0) {
            // Only draw ring if there's any habit progress
            canvas.drawArc(oval, 0, 360, false, ringBg);
            
            // Draw habit progress ring (foreground)
            Paint ringFg = new Paint(Paint.ANTI_ALIAS_FLAG);
            ringFg.setStyle(Paint.Style.STROKE);
            ringFg.setStrokeWidth(strokeWidth);
            ringFg.setColor(accentColor);
            ringFg.setStrokeCap(Paint.Cap.ROUND);
            
            int clamped = Math.max(0, Math.min(100, habitProgress));
            float sweep = (360f * clamped) / 100f;
            canvas.drawArc(oval, 270f, sweep, false, ringFg);
        }

        // Draw today highlight circle (filled, semi-transparent)
        if (isToday) {
            Paint todayBg = new Paint(Paint.ANTI_ALIAS_FLAG);
            todayBg.setStyle(Paint.Style.FILL);
            todayBg.setColor(accentColor);
            todayBg.setAlpha(80); // semi-transparent
            canvas.drawCircle(centerX, centerY, radius - strokeWidth, todayBg);
        }

        // Draw day number
        Paint textPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        textPaint.setColor(isToday ? 0xFFFFFFFF : 0xFFE0E0E0);
        textPaint.setTextSize(sizePx * 0.35f);
        textPaint.setTextAlign(Paint.Align.CENTER);
        textPaint.setTypeface(isToday ? Typeface.DEFAULT_BOLD : Typeface.DEFAULT);
        
        // Center text vertically
        Paint.FontMetrics fm = textPaint.getFontMetrics();
        float textY = centerY - (fm.ascent + fm.descent) / 2f;
        
        canvas.drawText(String.valueOf(dayNumber), centerX, textY, textPaint);

        // Draw strikethrough slash for diary entries
        if (hasEntry) {
            Paint slashPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            slashPaint.setStyle(Paint.Style.STROKE);
            slashPaint.setStrokeWidth(sizePx * 0.06f);
            slashPaint.setColor(accentColor);
            slashPaint.setStrokeCap(Paint.Cap.ROUND);
            
            // Diagonal slash from top-right to bottom-left
            float slashOffset = radius * 0.5f;
            canvas.drawLine(
                centerX + slashOffset, 
                centerY - slashOffset,
                centerX - slashOffset, 
                centerY + slashOffset,
                slashPaint
            );
        }

        return bmp;
    }
}
