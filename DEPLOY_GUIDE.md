# KYAC Hyperread Pro - Yayınlama Kılavuzu

Uygulamayı telefonunuzda kullanmak için internete yüklemeniz (Deploy) gerekmektedir. Kodlarınız hazır olduğu için bunu ücretsiz servislerle dakikalar içinde yapabilirsiniz.

## Seçenek 1: Vercel ile Yayınlama (Önerilen)

En hızlı ve profesyonel yöntem budur.

1. **GitHub'a Yükleyin**:
   - Bu proje klasörünü GitHub hesabınızda yeni bir depo (repository) olarak oluşturun ve yükleyin.

2. **Vercel'e Bağlayın**:
   - [Vercel.com](https://vercel.com) adresine gidin ve (GitHub ile) üye olun.
   - "Add New" -> "Project" butonuna tıklayın.
   - GitHub listenizden **hyperread-pro** (veya projenize verdiğiniz isim) deposunu seçin "Import" deyin.
   - Hiçbir ayarı değiştirmeden **"Deploy"** butonuna basın.

3. **Linkinizi Alın**:
   - Kurulum bitince (yaklaşık 1-2 dk), Vercel size `https://kyac-hyperread.vercel.app` benzeri bir link verecek.
   - **Bu linki telefonunuzdaki Chrome tarayıcısında açın.**
   - Menüden "Ana Ekrana Ekle" diyerek telefonunuza uygulama gibi indirin.

## Seçenek 2: Netlify Drop (GitHub Hesabı Olmadan)

Eğer uygulamanın çalışır halini (`dist` klasörü) oluşturabilirseniz, bu klasörü sürükle-bırak yöntemiyle yükleyebilirsiniz. Ancak bunun için bilgisayarınızda `npm run build` komutunu çalıştırmanız gerekir.

1. Bilgisayarınızda terminali açın.
2. `npm install` yazıp enter'a basın.
3. `npm run build` yazıp enter'a basın.
4. Oluşan `dist` klasörünü [Netlify Drop](https://app.netlify.com/drop) sayfasına sürükleyin.
5. Size vereceği linki kullanın.
