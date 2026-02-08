package com.krishna.dailyjournal;

import android.content.Context;
import android.os.FileObserver;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import java.io.File;

/**
 * Watches widget-data.json for changes and forces a widget refresh.
 * This avoids any JS->native calls at runtime; the native side simply
 * observes the file the app already writes.
 */
public final class WidgetDataFileObserver {
  private static final String TAG = "WidgetDataFileObserver";
  private static final long DEBOUNCE_MS = 100; // Small debounce to ensure file is written

  private final FileObserver observer;
  private final Handler handler;
  private Runnable pendingRefresh;
  private final Context appContext;

  public WidgetDataFileObserver(Context context) {
    this.appContext = context.getApplicationContext();
    this.handler = new Handler(Looper.getMainLooper());
    
    File file = new File(context.getFilesDir(), "widget-data.json");
    // Watch the parent directory so we still get events if the file is replaced.
    File parent = file.getParentFile();

    observer = new FileObserver(parent.getAbsolutePath(),
      FileObserver.CREATE | FileObserver.MODIFY | FileObserver.MOVED_TO | FileObserver.CLOSE_WRITE) {
      @Override
      public void onEvent(int event, String path) {
        if (path == null) return;
        if (!"widget-data.json".equals(path)) return;
        
        Log.d(TAG, "File event detected: " + event + " for " + path);
        
        // Debounce: cancel any pending refresh and schedule a new one
        if (pendingRefresh != null) {
          handler.removeCallbacks(pendingRefresh);
        }
        
        pendingRefresh = () -> {
          try {
            Log.d(TAG, "Executing widget refresh after file change");
            WidgetsUpdater.updateAll(appContext);
          } catch (Exception e) {
            Log.e(TAG, "Failed to refresh widgets after file change", e);
          }
        };
        
        handler.postDelayed(pendingRefresh, DEBOUNCE_MS);
      }
    };
  }

  public void start() {
    Log.d(TAG, "Starting file observer");
    observer.startWatching();
  }

  public void stop() {
    Log.d(TAG, "Stopping file observer");
    if (pendingRefresh != null) {
      handler.removeCallbacks(pendingRefresh);
    }
    observer.stopWatching();
  }
}
