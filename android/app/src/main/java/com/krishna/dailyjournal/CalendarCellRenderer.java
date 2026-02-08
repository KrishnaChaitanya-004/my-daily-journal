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
        float radius = sizePx * 0.42f; // Increased for better visibility
        float strokeWidth = sizePx * 0.12f; // Thicker ring

        // Draw habit progress ring (background track)
        Paint ringBg = new Paint(Paint.ANTI_ALIAS_FLAG);
        ringBg.setStyle(Paint.Style.STROKE);
        ringBg.setStrokeWidth(strokeWidth);
        ringBg.setColor(0xFF3A3A3A); // Slightly lighter grey for visibility

        RectF oval = new RectF(
            centerX - radius,
            centerY - radius,
            centerX + radius,
            centerY + radius
        );
        
        // Always draw the ring background (shows what progress is possible)
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

        // Draw day number (no today highlight per user request)
        Paint textPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        textPaint.setColor(0xFFE0E0E0); // Always same color
        textPaint.setTextSize(sizePx * 0.32f);
        textPaint.setTextAlign(Paint.Align.CENTER);
        textPaint.setTypeface(Typeface.DEFAULT);
        
        // Center text vertically
        Paint.FontMetrics fm = textPaint.getFontMetrics();
        float textY = centerY - (fm.ascent + fm.descent) / 2f;
        
        canvas.drawText(String.valueOf(dayNumber), centerX, textY, textPaint);

        // Draw cool strikethrough for diary entries (double diagonal lines with glow effect)
        if (hasEntry) {
            float slashOffset = radius * 0.55f;
            
            // Glow/shadow effect first (larger, semi-transparent)
            Paint glowPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            glowPaint.setStyle(Paint.Style.STROKE);
            glowPaint.setStrokeWidth(sizePx * 0.10f);
            glowPaint.setColor(accentColor);
            glowPaint.setAlpha(80);
            glowPaint.setStrokeCap(Paint.Cap.ROUND);
            
            // Main diagonal line (top-left to bottom-right for checkmark feel)
            canvas.drawLine(
                centerX - slashOffset, 
                centerY - slashOffset,
                centerX + slashOffset, 
                centerY + slashOffset,
                glowPaint
            );
            
            // Main strikethrough line
            Paint slashPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            slashPaint.setStyle(Paint.Style.STROKE);
            slashPaint.setStrokeWidth(sizePx * 0.06f);
            slashPaint.setColor(accentColor);
            slashPaint.setStrokeCap(Paint.Cap.ROUND);
            
            canvas.drawLine(
                centerX - slashOffset, 
                centerY - slashOffset,
                centerX + slashOffset, 
                centerY + slashOffset,
                slashPaint
            );
            
            // Second shorter accent line for style
            float shortOffset = slashOffset * 0.4f;
            canvas.drawLine(
                centerX + slashOffset * 0.3f, 
                centerY - slashOffset,
                centerX + slashOffset, 
                centerY - slashOffset * 0.3f,
                slashPaint
            );
        }

        return bmp;
    }
}
