# Demo Video Recording Guide

**Purpose:** Record marketing demo videos showing the complete desktop-to-phone connect card scanning flow.

**Last Updated:** 2026-01-01

---

## The Challenge

Our connect card scanning flow involves two devices:

1. **Desktop:** Staff opens admin dashboard, generates QR code
2. **Phone:** Volunteer scans QR, opens camera wizard, captures cards

Recording this seamlessly requires showing both screens in one video.

---

## Recommended Solution: Screen Mirroring

Mirror your iPhone screen to Windows, then record everything in one take. No editing required.

### Setup Requirements

- **Desktop:** Windows
- **Phone:** iPhone
- **Network:** Both devices on same WiFi

---

## Quick Start Guide

### Step 1: Install AirPlay Receiver on Windows

Choose one:

| Tool            | Cost   | Notes                                                                     |
| --------------- | ------ | ------------------------------------------------------------------------- |
| **LetsView**    | Free   | https://letsview.com/ - Recommended for simplicity                        |
| **5KPlayer**    | Free   | https://www.5kplayer.com/ - Has AirPlay built-in                          |
| **Reflector 4** | $19.99 | https://www.airsquirrels.com/reflector - Adds device frames automatically |

### Step 2: Mirror iPhone to Windows

1. Open your AirPlay receiver app (LetsView, etc.)
2. On iPhone: Swipe down from top-right → **Control Center**
3. Tap **Screen Mirroring**
4. Select your PC from the list
5. iPhone screen now appears on Windows!

### Step 3: Arrange Your Layout

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   ┌──────────────────┐    ┌──────────────────┐  │
│   │                  │    │                  │  │
│   │   Church Connect │    │   iPhone Mirror  │  │
│   │   Hub Dashboard  │    │   (LetsView)     │  │
│   │                  │    │                  │  │
│   │                  │    │                  │  │
│   └──────────────────┘    └──────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Step 4: Record

**Option A: Windows Game Bar (Simplest)**

1. Press `Win + G` to open Game Bar
2. Click the Record button (or press `Win + Alt + R`)
3. Demo the full flow
4. Press `Win + Alt + R` again to stop

**Option B: OBS Studio (More Control)**

1. Download OBS from https://obsproject.com/
2. Add Window Capture sources for both windows
3. Arrange in scene
4. Click "Start Recording"

---

## Recording Checklist

### Before Recording

- [ ] Both devices on same WiFi
- [ ] iPhone in Do Not Disturb mode (Settings → Focus → Do Not Disturb)
- [ ] Close unnecessary apps on both devices
- [ ] Phone on charger (screen mirroring drains battery)
- [ ] Use a phone stand for steady camera
- [ ] Practice the flow once

### Demo Flow to Record

1. **Desktop:** Show dashboard, navigate to Connect Cards
2. **Desktop:** Click to generate QR code
3. **Phone:** (visible in mirror) Scan QR code
4. **Phone:** Camera wizard opens
5. **Phone:** Capture a connect card (front/back)
6. **Phone:** Show the queue with card processing
7. **Desktop:** Show the processed card in review queue
8. **Desktop:** Review and approve the card
9. **Desktop:** Show it saved to contacts

### After Recording

- [ ] Trim start/end if needed (Windows Photos app can do basic trims)
- [ ] Export at 1080p or higher for marketing quality

---

## Pro Tips

1. **Landscape mode** on phone works better for side-by-side layout
2. **Slow down** your actions slightly - viewers need time to follow
3. **Use a sample connect card** with clear, readable handwriting
4. **Consider voiceover** - record video first, add narration after
5. **Hide browser bookmarks bar** for cleaner look

---

## Alternative: Separate Recordings (More Polish)

If one-take doesn't work well:

1. Record desktop actions separately
2. Record phone actions separately
3. Edit together with transitions in:
   - Clipchamp (free, built into Windows)
   - DaVinci Resolve (free, professional)
   - Adobe Premiere (paid)

This gives more control but requires video editing skills.

---

## Tool Links

- **LetsView:** https://letsview.com/
- **5KPlayer:** https://www.5kplayer.com/
- **Reflector 4:** https://www.airsquirrels.com/reflector
- **OBS Studio:** https://obsproject.com/
- **Clipchamp:** Built into Windows 11

---

## See Also

- [Connect Cards Feature](/docs/features/connect-cards/README.md)
- [QR Code Scan Flow](/docs/features/connect-cards/README.md#qr-code-scan-flow)
