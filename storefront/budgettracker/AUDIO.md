# BAKHY Budget — spoken feedback files

Put one short file per line in `storefront/public/budgettracker/audio/<lang>/<name>.mp3` (1–3 seconds, mono, ≤100 KB, normalised volume).
Only languages listed in `AUDIO_LANGS` (`strings.js`) are played; today that is `az`. A missing file is skipped silently.

| File name | Suggested Azerbaijani line | When it plays |
| --- | --- | --- |
| `welcome.mp3` | Xoş gəldiniz | Demo opens / first sign-in |
| `loginOk.mp3` | Giriş uğurludur | After signing in |
| `incomeAdded.mp3` | Gəlir əlavə edildi | Income saved |
| `expenseAdded.mp3` | Xərc əlavə edildi | Expense saved |
| `saleAdded.mp3` | Satış qeydə alındı | Sale saved |
| `deleted.mp3` | Qeyd silindi | Entry deleted |
| `budget80.mp3` | Büdcənin səksən faizi istifadə olundu | Category spend reaches 80% of its limit |
| `budgetOver.mp3` | Büdcə aşıldı | Category spend passes its limit |
| `goalHalf.mp3` | Hədəfin yarısı tamamlandı | Monthly sales reach 50% of the goal |
| `goalDone.mp3` | Təbriklər, hədəfə çatdınız | Monthly sales reach the goal |
| `synced.mp3` | Məlumatlar yeniləndi | Reserved for a manual sync |
| `error.mp3` | Xəta baş verdi, yenidən cəhd edin | Invalid amount |
