package com.cocos.game;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.PixelFormat;
import android.media.AudioManager;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.os.BatteryManager;
import android.os.Build;
import android.os.Environment;
import android.os.Looper;
import android.provider.Settings;
import android.view.PixelCopy;
import android.view.View;
import android.view.Window;

import java.io.File;
import java.io.FileOutputStream;

import com.cocos.lib.JsbBridge;

import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;

public class NativeBaseBridge {

    private static Activity sActivity;

    public static void init(Activity activity) {
        sActivity = activity;

        JsbBridge.setCallback((arg0, arg1) -> {
            handleMessage(arg0, arg1);
        });
    }

    /* ===================== 入口 ===================== */

    private static void handleMessage(String arg0, String arg1) {
        try {
            JSONObject obj = new JSONObject(arg0);
            String action = obj.optString("action");

            switch (action) {
                case "screenshot":
                    screenshot();
                    break;
                case "deviceInfo":
                    getDeviceInfo();
                    break;
                case "networkState":
                    getNetworkState();
                    break;
            }
        } catch (Exception e) {
            reply("error", e.getMessage());
        }
    }

    /* ===================== 功能实现 ===================== */

    private static void screenshot() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            reply("screenshot", "only_support_android_8_plus");
            return;
        }

        Activity activity = sActivity;
        if (activity == null) {
            reply("screenshot", "activity_null");
            return;
        }

        Window window = activity.getWindow();
        View root = window.getDecorView().getRootView();

        Bitmap bitmap = Bitmap.createBitmap(
                root.getWidth(),
                root.getHeight(),
                Bitmap.Config.ARGB_8888
        );

        PixelCopy.request(window, bitmap, result -> {
            if (result == PixelFormat.UNKNOWN) {
                reply("screenshot", "pixelcopy_fail");
                return;
            }

            File file = saveBitmap(bitmap);
            if (file != null && file.exists()) {
                reply("screenshot", file.getAbsolutePath());
            } else {
                reply("screenshot", "save_fail");
            }
        }, new android.os.Handler(Looper.getMainLooper()));
    }
    private static File saveBitmap(Bitmap bitmap) {
        File dir = sActivity.getExternalFilesDir(Environment.DIRECTORY_PICTURES);
        if (dir == null) dir = sActivity.getFilesDir();

        File file = new File(dir, "screenshot_" + System.currentTimeMillis() + ".png");

        try (FileOutputStream fos = new FileOutputStream(file)) {
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, fos);
            fos.flush();
            return file;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
    /**  获取设备信息（含电量 & 音量） */
    private static void getDeviceInfo() {
        JSONObject info = new JSONObject();

        try {
            // ===== 基础设备信息 =====
            info.put("brand", Build.BRAND);
            info.put("model", Build.MODEL);
            info.put("sdkInt", Build.VERSION.SDK_INT);
            info.put("release", Build.VERSION.RELEASE);
            info.put("deviceId", Settings.Secure.getString(
                    sActivity.getContentResolver(),
                    Settings.Secure.ANDROID_ID
            ));

            // ===== 电量信息 =====
            BatteryManager bm =
                    (BatteryManager) sActivity.getSystemService(Context.BATTERY_SERVICE);

            int battery = bm != null ?
                    bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY) : -1;

            boolean charging = isCharging();

            info.put("battery", battery);
            info.put("charging", charging);

            // ===== 音量信息（媒体音量，游戏最常用） =====
            AudioManager am =
                    (AudioManager) sActivity.getSystemService(Context.AUDIO_SERVICE);

            int volume = -1;
            int maxVolume = -1;

            if (am != null) {
                volume = am.getStreamVolume(AudioManager.STREAM_MUSIC);
                maxVolume = am.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
            }

            info.put("volume", volume);
            info.put("maxVolume", maxVolume);

        } catch (Exception ignored) {}

        reply("deviceInfo", info.toString());
    }
    /** 是否正在充电 */
    private static boolean isCharging() {
        Intent intent = sActivity.registerReceiver(
                null,
                new IntentFilter(Intent.ACTION_BATTERY_CHANGED)
        );

        if (intent == null) return false;

        int status = intent.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
        return status == BatteryManager.BATTERY_STATUS_CHARGING
                || status == BatteryManager.BATTERY_STATUS_FULL;
    }

    /** 获取网络状态 */
    private static void getNetworkState() {
        ConnectivityManager cm =
                (ConnectivityManager) sActivity.getSystemService(Context.CONNECTIVITY_SERVICE);

        boolean connected = false;
        String type = "none";

        if (cm != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                NetworkCapabilities nc = cm.getNetworkCapabilities(cm.getActiveNetwork());
                if (nc != null) {
                    connected = true;
                    if (nc.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) {
                        type = "wifi";
                    } else if (nc.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)) {
                        type = "mobile";
                    }
                }
            }
        }

        JSONObject net = new JSONObject();
        try {
            net.put("connected", connected);
            net.put("type", type);
        } catch (Exception ignored) {}

        reply("networkState", net.toString());
    }

    /* ===================== 工具 ===================== */

    private static void reply(String action, String data) {
        JSONObject msg = new JSONObject();
        try {
            msg.put("action", action);
            msg.put("data", data);
        } catch (Exception ignored) {}
        JsbBridge.sendToScript(msg.toString(), null);
    }
}