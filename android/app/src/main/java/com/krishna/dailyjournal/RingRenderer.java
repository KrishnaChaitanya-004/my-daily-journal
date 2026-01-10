package com.krishna.dailyjournal;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;

/**
 * Renders a static circular progress ring as a Bitmap for RemoteViews.
 * This avoids ProgressBar tinting limitations inside widgets and guarantees
 * the ring color matches the app accent color.
 */
public final class RingRenderer {
  private RingRenderer() {}

  public static Bitmap render(Context context, int sizeDp, int strokeDp, int progressPercent, int accentColor) {
    float density = context.getResources().getDisplayMetrics().density;
    int sizePx = Math.max(1, Math.round(sizeDp * density));
    float strokePx = Math.max(1f, strokeDp * density);

    Bitmap bmp = Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.ARGB_8888);
    Canvas canvas = new Canvas(bmp);

    Paint bg = new Paint(Paint.ANTI_ALIAS_FLAG);
    bg.setStyle(Paint.Style.STROKE);
    bg.setStrokeWidth(strokePx);
    bg.setColor(0xFF2A2A2A); // dark grey background ring
    bg.setStrokeCap(Paint.Cap.ROUND);

    Paint fg = new Paint(Paint.ANTI_ALIAS_FLAG);
    fg.setStyle(Paint.Style.STROKE);
    fg.setStrokeWidth(strokePx);
    fg.setColor(accentColor);
    fg.setStrokeCap(Paint.Cap.ROUND);

    float pad = strokePx / 2f;
    RectF oval = new RectF(pad, pad, sizePx - pad, sizePx - pad);

    // Background full circle
    canvas.drawArc(oval, 0, 360, false, bg);

    // Foreground arc starting from top (270deg)
    int clamped = Math.max(0, Math.min(100, progressPercent));
    float sweep = (360f * clamped) / 100f;
    canvas.drawArc(oval, 270f, sweep, false, fg);

    return bmp;
  }
}
