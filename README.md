# CildAI
<img src="https://github.com/user-attachments/assets/870f26fb-11a6-4441-bf93-0b908a8b1d17" alt="CildAI Logo" width="400"/>

## 👥 Takım Üyeleri

| Name               | Title                        | GitHub                                                                 | LinkedIn                                                                 |
|--------------------|------------------------------|------------------------------------------------------------------------|--------------------------------------------------------------------------|
| Yusuf Mert Genç    | Scrum Master – Developer     | [GitHub Profile](https://github.com/YusufMertGenc)                     | [LinkedIn Profile](https://www.linkedin.com/in/yusufmertgenc/)           |
| Feyza İnal         | Product Owner – Developer    | [GitHub Profile](https://github.com/feyza-inl)                        | [LinkedIn Profile](https://www.linkedin.com/in/feyzainalcse1/)            |
| Muhammed İkbal Laç | Developer                    | [GitHub Profile](https://github.com/m-ikbal)                           | [LinkedIn Profile](https://www.linkedin.com/in/m-ikb4l/)                 |
| Muzaffer Türkoğlu  | Developer                    | [GitHub Profile](https://github.com/muzafferturkoglu).                  | [LinkedIn Profile](https://www.linkedin.com/in/muzaffert%C3%BCrko%C4%9Flu/)                                                     |

## Ürün İsmi
CildAI


## Product Backlog URL
https://trello.com/invite/b/685bc83a4f7c773d4bd4486c/ATTI8f82cf1744507d75dcd0ac5707eb5785723871F9/bootcamp-grup-106

## Ürün Açıklaması

Günümüzde dermatoloji (cildiye) bölümlerinden randevu almak her geçen gün daha zor hale geliyor. Ancak birçok cilt problemi, basit ve zamanında müdahalelerle çözülebilirken, bazıları ihmal edildiğinde daha ciddi sağlık sorunlarına yol açabiliyor. Bu noktada CildAI, kullanıcılara kolay ve hızlı bir çözüm sunmak amacıyla geliştirilmiştir.

CildAI, yapay zekâ destekli dijital bir dermatoloji asistanıdır. Kullanıcılar, ciltlerindeki problemi gösteren bir fotoğrafı sisteme yükleyerek kısa sürede analiz sonucuna ulaşabilir. Uygulama, yüklenen görseli değerlendirerek cilt tipi hakkında tahminlerde bulunur, gözle görülebilir cilt problemlerini tespit eder ve bakım önerileri sunar. Eğer görselde riskli bir durum tespit edilirse, kullanıcıyı bir dermatoloğa başvurması konusunda bilgilendirir.

CildAI’nin amacı, gereksiz hastane ziyaretlerini azaltmak, erken müdahale imkânı sağlamak ve kullanıcıları cilt sağlığı konusunda bilinçlendirmektir. Böylece cilt problemleri için ilk adımın daha kolay, erişilebilir ve anlaşılır bir şekilde atılması sağlanır.


  ## Ürün Özellikleri 

  <h3> Cilt Fotoğrafı ile Yapay Zekâ Tabanlı Analiz</h3>
  <p>Kullanıcılar sisteme kayıt olup giriş yaptıktan sonra ciltlerindeki problemi gösteren bir fotoğraf yükleyerek analiz başlatabilir. Yüklenen görsel Gemini API kullanılarak analiz edilir; kullanıcıya olası cilt rahatsızlıkları, ürün önerileri ve risk durumu hakkında net bir çıktı sunulur.</p>

  <h3> Açıklama Ekleyerek Daha İyi Tahmin</h3>
  <p>Fotoğraf yüklenirken kullanıcı, belirtilerini veya dikkat edilmesini istediği noktaları açıklama olarak iletebilir. Bu bilgiler Gemini modeline dahil edilerek daha doğru ve kişiselleştirilmiş analizler sağlanır.</p>

  <h3> Ürün ve Doğal Çözüm Önerileri</h3>
  <p>Model, analiz sonucunda hem eczaneden alınabilecek hem de doğal yollarla uygulanabilecek öneriler sunar. Kullanıcıya uygun içerikler ve örnek ürün tipleri madde madde listelenir.</p>

  <h3> Ciddi Risk Uyarı Sistemi</h3>
  <p>Model, görselde ciddi veya şüpheli bir durum tespit ederse kullanıcıyı <strong>“Mutlaka bir dermatoloğa danışın”</strong> gibi uyarılarla yönlendirir. Risk yoksa gereksiz panik yaratmadan durumu açıklığa kavuşturur.</p>

  <h3> Türkçe ve Açıklayıcı Yanıtlar</h3>
  <p>CildAI, karmaşık tıbbi terimleri sadeleştirerek anlaşılır ve motive edici bir dille kullanıcıya Türkçe çıktı sunar. Yanıtlar bölümlere ayrılmış, anlaşılır ve sade bir yapıda iletilir.</p>

  <h3> Web Arayüzü Üzerinden Hızlı ve Basit Kullanım</h3>
  <p>Kullanıcılar tarayıcı üzerinden fotoğraf seçebilir ya da anlık olarak kamera ile çekim yapabilir. Sistem kullanıcı dostu bir arayüz ile analiz sürecini adım adım yönetir.</p>

  <h3> Kullanıcı Kayıt ve Giriş Sistemi</h3>
  <p>Kullanıcılar e-posta ve şifre ile kayıt olabilir, giriş yaptıktan sonra analiz özelliklerini kullanabilir. Giriş doğrulama işlemleri <strong>JWT (JSON Web Token)</strong> ile güvenli şekilde gerçekleştirilir.</p>

  <h3> Kişiye Özel Analiz Geçmişi </h3>
  <p>Gelecek sürümlerde kullanıcıların daha önce yaptığı analizleri görebileceği bir geçmiş sayfası planlanmaktadır. Bu özellik sayesinde cilt durumundaki değişim ve ilerleme takip edilebilecektir.</p>

  <h3> Gizlilik ve Veri Güvenliği</h3>
  <p>Yüklenen görseller ve kullanıcı açıklamaları yalnızca analiz sürecinde kullanılır ve işlem sonrasında sistemde tutulmaz. Kullanıcı verisi hiçbir şekilde üçüncü taraflarla paylaşılmaz.</p>
</section>





## Hedef Kitle

<ol>
  <li>
    <strong>Yoğun Tempolu Çalışan Bireyler</strong><br>
    <span>- Gün içinde hastaneye gitmeye vakit bulamayan, sağlık problemlerini erteleyen ancak hızlı bilgiye ihtiyaç duyan kişiler.</span>
  </li>
  <li>
    <strong>Üniversite Öğrencileri ve Genç Yetişkinler</strong><br>
    <span>- Akne, sivilce gibi yaygın cilt problemleri yaşayan; hem çözüm arayan hem de doktora gitmekte zorlanan genç kitle.</span>
  </li>
  <li>
    <strong>Kırsal Bölgelerde Yaşayanlar</strong><br>
    <span>- Dermatoloji uzmanına ulaşmanın zor olduğu bölgelerde yaşayan ve basit cilt problemlerini hızlıca analiz etmek isteyen kullanıcılar.</span>
  </li>
  <li>
    <strong>Yeni Ebeveynler</strong><br>
    <span>- Çocuklarının cilt problemlerine dair erken bilgi almak isteyen, doktora gitmeden önce durumun ciddiyetini öğrenmek isteyen aileler.</span>
  </li>
  <li>
    <strong>Sağlık Bilinci Yüksek Dijital Kullanıcılar</strong><br>
    <span>- Kendi sağlığıyla ilgilenen, teknolojiye yatkın ve dijital sağlık uygulamalarını aktif kullanan bireyler.</span>
  </li>
  <li>
    <strong>Cilt Bakımı ve Güzellikle İlgilenenler</strong><br>
    <span>- Kozmetik ürünleri kullanmadan önce cilt durumu hakkında bilgi almak isteyen, estetik görünümüne önem veren kullanıcılar.</span>
  </li>
</ol>
   
<details open>
<summary><strong>Sprint 1</strong></summary>

Daily Scrum WhatsApp üzerinden yapılması kararlaştırılmıştır. Ayrıca haftada 2 kez Google Meet üzerinden toplantı yapılmaktadır.
[WhatsApp](https://docs.google.com/document/d/1FLoClnP6Rm0HkNO5hTPNYlvJD8l6ZGhptwZLcr0uJsw/edit?usp=sharing) 

İlk sprint için tamamlanması gereken puan 150 olarak belirlenmiştir.

**Puan Tamamlama Mantığı:** Toplamda proje boyunca tamamlanması gereken puan 500 puan olarak belirlenmiştir. 3 sprint'e bölündüğünde ilk sprint'in en azından 150 ile başlaması gerektiğine karar verildi.

## Sprint Notları

1. Sprint'in Backlog Items kısmının **Trello** üzerinden yapılmasına karar verilmiştir.  
2. Kullanıcı girişi ve kayıt sistemi tamamlanmıştır.
3. Veritabanı bağlantısı lokalde çalışacak şekilde yapılmıştır  
4. Görsel yükleme ve kamera ile analiz başlatma fonksiyonu çalışmaktadır.  
5. Gemini API ile temel analiz senaryosu başarıyla entegre edilmiştir.  


## Sprint Board Görüntüsü

Trello üzerinden planlanan görevlerin durumu aşağıda gösterilmiştir:

![Sprint Board](https://github.com/user-attachments/assets/c93b12a1-2e31-4116-b00d-acca41f33f83)


## Ürünün 1. Sprint Sonu Görüntüleri

Kayıt, giriş, görsel yükleme ve analiz ekranlarından örnekler:


![Ekran görüntüsü 2025-07-03 124754](https://github.com/user-attachments/assets/80a95146-071d-42a2-b4e6-eb6bf80077fb)

![Untitled (1)](https://github.com/user-attachments/assets/1555a5d7-90a5-4bcd-b537-87472958aa02)

## Sprint 1 Review 

-  Kamera ile fotoğraf çekme ve görsel yükleme modülleri başarıyla entegre edildi.  
-  Gemini API bağlantısı kurularak temel cilt analiz senaryosu çalıştırıldı.  
-  Yapay zekâ tarafından analiz edilen görselden yola çıkarak cilt tipi tespiti , bakım önerileri ve var olan cilt sorunun çözümleri hakkında tüyolar kullanıcıya sunuldu.  
-  Kullanıcı arayüzü tasarlandı ve temel stil uygulamaları tamamlandı.  
-  Veritabanı bağlantısı tamamlandı ve kullanıcıya özel analiz geçmişi gibi özelliklerin 2. sprintte eklenmesine karar verildi.

## Sprint 1 Retrospective 

- Kamera ve görsel yükleme modülleri sorunsuz şekilde çalıştı.  
- Gemini API ile temel analiz başarıyla entegre edildi.  
- Veritabanı entegrasyonu gerçekleştirildi.  
- Bir sonraki sprintte analiz geçmişi geliştirilecek.

</details>

## Sprint 2

<details>

Daily Scrum WhatsApp üzerinden yapılması kararlaştırılmıştır. Ayrıca haftada 2 kez Google Meet üzerinden toplantı yapılmaktadır.
[WhatsApp](https://docs.google.com/document/d/1DqaNYERf67wZJCIukt82bfNLmlmdU3RIkjStB5OfpzM/edit?usp=sharing)

İkinci sprint için tamamlanması gereken puan 200 olarak belirlenmiştir.

**Puan Tamamlama Mantığı:** Toplamda proje boyunca tamamlanması gereken puan 500 puan olarak belirlenmiştir. 3 sprint'e bölündüğünde ikinci sprint 200 puan hedeflenmiş ve hedefe ulaşılmıştır.

## Sprint Notları

1. Sprint sorunsuz ilerlemiştir.
2. Trello üzerinden takip edilen Sprint 2 backlog öğelerinin tamamı başarıyla tamamlandı.
3. Veritabanı bağlantıları başarıyla sağlanmıştır.
4. Kayıt sürecine mail doğrulama özelliği eklendi, kullanıcı güvenliği artırıldı.
5. Geçmiş analizleri görüntüleme fonksiyonu sorunsuz çalışmaktadır.


## Sprint Board Görüntüleri

<img width="1308" height="810" alt="Ekran görüntüsü 2025-07-18 003849" src="https://github.com/user-attachments/assets/88dd3dbe-dcf8-41f7-b164-12dedf211cd2" />


## Ürünün 2. Sprint Sonu Görüntüleri

Mail ile doğrulama, Şifreyi değiştirme, geçmiş analizleri görüntüleme ekranlarından örnekler:

<img width="3983" height="2418" alt="Untitled (2)" src="https://github.com/user-attachments/assets/c9dc95ce-c1b7-4f9c-9346-14217cd0a994" />


![İsimsiz video ‐ Clipchamp ile yapıldı](https://github.com/user-attachments/assets/66f4c2db-8435-4790-b591-e84d4a900a5f)   ![İsimsiz video ‐ Clipchamp ile yapıldı (1)](https://github.com/user-attachments/assets/e846565a-cc10-4d37-ac7c-b1ae81c0b7a1)



## Sprint 2 Review 

1. Kullanıcı kayıt sürecine mail doğrulama adımı başarıyla entegre edildi.
2. Kullanıcıların geçmiş analiz sonuçlarını görüntüleyebileceği arayüz geliştirildi ve veritabanı bağlantısı başarıyla kuruldu.
3. Kullanıcı arayüzüne şifre değiştirme arayüzü eklendi.
4. Arayüz tasarımları daha da iyileştirildi kullanıcı deneyimini iyileştirme üzerine çalışıldı.
5. Bu sprint için belirlenen backlog maddeleri başarıyla tamamlandı ve hedeflenen 200 puana ulaşıldı.

## Sprint 2 Retrospective

1. Mail doğrulama sistemi stabil çalıştı.
2. Geçmiş analiz görüntüleme özelliği veritabanı ile entegre bir şekilde sorunsuz tamamlandı.
3. Daily Scrum düzenli yapıldı, takım içi iletişim verimliydi.
4. Bir sonraki sprintte analiz sonucunun zenginleştirilmesine ve sonucun pdf ile indirilebilmesine odaklanmasına kararlaştırıldı.

</details>
