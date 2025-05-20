---
layout: single
title: "Puang-Keyring 제작 가이드"
categories: 

toc: true
toc_sticky: true

---
## 준비물
OLED, 아두이노 나노, USB 케이블(아두이노 포트 맞게), 건전지(CR2032), 건전지 홀더, 스위치  
<img src="/assets/images/post/CAU-COSS/KakaoTalk_20250520_082928200_21.jpg" alt="준비물" style="max-width: 50%; height: auto;">

### 1. 회로 연결하기
먼저 OLED와 아두이노 나노를 연결해 줍니다.  
<div style="display: flex; justify-content: center; align-items: flex-start; gap: 20px;">
  <img src="/assets/images/post/CAU-COSS/KakaoTalk_20250520_082928200_20.jpg" alt="회로연결1" style="max-width: 48%;">
  <img src="/assets/images/post/CAU-COSS/KakaoTalk_20250520_082928200_19.jpg" alt="회로연결2" style="max-width: 48%;">
</div>
핀을 잘 확인하고 저로 짝이 잘 맞는지 확인하세요. 특히 5V, GND를 반대로 꽂진 않았는지 확인하세요.  
OLED    - Arduino Nano  
VCC     - 5V  
GND     - GND  
SCL     - A5  
SDA     - A4  

---

### 2. 프로그래밍 
Arduino IDE를 킨 다음 코드를 입력해 줍니다.  
<div style="display: flex; justify-content: center; align-items: flex-start; gap: 20px;">
  <img src="/assets/images/post/CAU-COSS/Snipaste_2025-05-20_09-09-34.png" alt="Image 1 Description" style="max-width: 48%;">
  <img src="/assets/images/post/CAU-COSS/Snipaste_2025-05-20_09-11-59.png" alt="Image 2 Description" style="max-width: 48%;">
</div>

코드작성이 완료되었으면 USB로 아두이노 나노를 연결해줍니다.  
"Select Board"를 클릭한 다음 포트를 선택해 줍니다.  
이때 보통 하나만 뜨며 COM(숫자) 형태로 뜹니다.  
  
그다음 업로드 버튼을 누르고 디스플레이 출력이 정상적으로 되는지 확인합니다.  

![](/assets\images\post\CAU-COSS\KakaoTalk_20250520_082928200_17.jpg)
푸앙이 얼굴이 정상적으로 나온다면 성공입니다!  

---

### 3. 전원 연결
USB 케이블을 아두이노 나노에서 분리합니다.  
건전지 홀더에 건전지를 넣은 다음 한쪽에는 스위치를 연결합니다.

건전지의 +극은 아두이노 나노 VIN 핀에  
건전지의 -극은 아두이노 나노 GND 핀에 연결해 줍니다.  

<div style="display: flex; justify-content: center; align-items: flex-start; gap: 20px;">
  <img src="/assets/images/post/CAU-COSS/KakaoTalk_20250520_082928200_11.jpg" alt="이미지 11" style="max-width: 48%;">
  <img src="/assets/images/post/CAU-COSS/KakaoTalk_20250520_082928200_10.jpg" alt="이미지 10" style="max-width: 48%;">
</div>

스위치를 켜서 전원이 제대로 들어오고 작동하는지 확인해 줍니다.
이후 조립과정에서 보드간의 쇼트가 나지 않도록 절연테이프를 이용해 절연 작업을 해주면 더 좋습니다.  

---

### 4. 조립
회로는 완성되었습니다. 이제 케이스에 회로를 넣으면 푸앙이 디스플레이 키링은 완성입니다.  
먼저 두꺼운 부품에 아두이노 나노를 끼워넣습니다. 이때 USB 포트가 오른쪽을 향하게 넣어줍니다.  
이때 핀에 다치지 않게 주의하고 만약 잘 안들어가면 막대기를 이용해 눌러서 넣어줍니다.  
<div style="display: flex; justify-content: center; align-items: flex-start; gap: 20px;">
  <img src="/assets/images/post/CAU-COSS/KakaoTalk_20250520_082928200_09.jpg" alt="Description for Image 09" style="max-width: 48%;">
  <img src="/assets/images/post/CAU-COSS/KakaoTalk_20250520_082928200_07.jpg" alt="Description for Image 07" style="max-width: 48%;">
</div>

스위치는 왼쪽면에 구멍이 난곳에 두어 글루건으로 고정해 줍니다.
![](/assets\images\post\CAU-COSS\KakaoTalk_20250520_082928200_04.jpg)
얼굴면도 덮은 다음 글루건으로 고정해 주면 완성입니다!
![](/assets\images\post\CAU-COSS\KakaoTalk_20250520_082928200_03.jpg)

![](/assets\images\post\CAU-COSS\KakaoTalk_20250520_082928200_02.jpg)
수고 많으셨습니다.

### 주의사항
1. USB 포트를 통해 전원을 공급할 수 있지만 이때는 스위치를 끈 상태에서 공급해 주세요.  
2. 배터리는 충전이 되지 않습니다.
3. 방수가 안되니 물이 있는 환경은 피해주세요.
