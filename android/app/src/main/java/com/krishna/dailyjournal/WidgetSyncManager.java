package com.krishna.dailyjournal;

import android.content.Context;
import android.util.Log;

/**
 * Singleton holder for WidgetDataFileObserver.
 * Starts once per process and keeps running while the app process is alive.
 */
public final class WidgetSyncManager {
  private static final String TAG = "WidgetSyncManager";
  private static WidgetDataFileObserver observer;

  private WidgetSyncManager() {}

  public static synchronized void ensureStarted(Context context) {
    if (observer != null) return;
    try {
      observer = new WidgetDataFileObserver(context.getApplicationContext());
      observer.start();
      Log.d(TAG, "Widget file observer started");
    } catch (Exception e) {
      Log.e(TAG, "Failed to start widget file observer", e);
      observer = null;
    }
  }
}
