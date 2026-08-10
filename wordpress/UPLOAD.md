# Ανέβασμα στο WordPress (`kastoriafm.gr/webapp`)

## Τι παίρνει ο επισκέπτης

Στο `https://kastoriafm.gr/webapp` ανοίγει ο player.
Σε Android Chrome εμφανίζεται **Εγκατάσταση εφαρμογής** και μπαίνει στην αρχική οθόνη σαν app.
Σε iPhone: Κοινή χρήση → **Προσθήκη στην οθόνη Αφετηρίας**.

> Σημείωση: αυτό είναι **PWA** (εγκαταστάσιμη web εφαρμογή), όχι αρχείο `.apk` από το Play Store.
> Αν θέλεις πραγματικό APK για Google Play, πες το και το φτιάχνουμε ξεχωριστά.

## Προετοιμασία πακέτου

```bash
chmod +x scripts/build-wordpress.sh
./scripts/build-wordpress.sh
```

Τα αρχεία για ανέβασμα είναι στον φάκελο `wordpress/`.

## Ανέβασμα (FTP / cPanel / File Manager)

1. Στο hosting δημιούργησε φάκελο: `public_html/webapp/`  
   (ή όποιο path αντιστοιχεί στο `kastoriafm.gr`)
2. Ανέβασε **όλα** τα περιεχόμενα του `wordpress/` μέσα στο `webapp/`  
   (όχι τον φάκελο `wordpress` ως υποφάκελο — τα αρχεία κατευθείαν μέσα)
3. Βεβαιώσου ότι υπάρχουν:
   - `index.html`
   - `stream.php`
   - `.htaccess`
   - `manifest.webmanifest`
   - `sw.js`
4. Άνοιξε: `https://kastoriafm.gr/webapp/`

## Αν το WordPress «τρώει» το `/webapp`

Στο **κύριο** `.htaccess` της ρίζας του site, πριν τους κανόνες WordPress, πρόσθεσε:

```apache
RewriteRule ^webapp/ - [L]
```

## Τι χρειάζομαι για να το ανεβάσω εγώ

Στείλε **ένα** από τα παρακάτω:

1. **SFTP/FTP**: host, χρήστης, κωδικός, path του `public_html`
2. ή **cPanel** / File Manager πρόσβαση
3. ή προσωρινό WordPress admin + Application Password

Μην στείλεις τον κύριο κωδικό email αν μπορείς να αποφύγεις — καλύτερα προσωρινό FTP user.
