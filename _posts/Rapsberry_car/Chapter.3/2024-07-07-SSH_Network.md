---
layout: single
title: "3.2 SSH connect"

toc: true
toc_sticky: true

---

라즈베리 파이를 쓰기 위해선 마우스랑 키보드 그리고 모니터 까지 연결해야 합니다.  
하지만 이는 매우 번거로운 일입니다.  
  
만약 SSH를 이용해 메인 컴퓨터로 라즈베리 파이를 원격제어할 수 있다면  
추가적인 모니터, 키보드, 마우스가 필요하지 않아 더 편하게 사용할 수 있습니다.  
## 1. Raspberry pi imager 세팅
Raspberry pi imager을 실행하고 우측 하단 톱니 바퀴를 클릭해 고급옵션을 선택할 수 있습니다.
![](/assets\images\post\raspberry_pi\ch3.2\1.png)
여기서 SSH 사용을 체크해 주세요.

만약 와이파이를 이용할 경우 무선 LAN 설정을 체크한 다음 와이파이의 SSID와 비밀번호를 입력해 주세요.  
(라즈베리 파이와 컴퓨터는 같은 인터넷에 접속되어 있어야 합니다.)  
![](/assets\images\post\raspberry_pi\ch3.2\2.png)


## 2. SSH 연결

### 2.1 Putty로 접속하기
우선 아래의 링크에 들어가서 Putty를 설치해 줍니다.
https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html

connection type에 SSH를 선택하고 IP 주소를 입력한 다음 open을 클릭합니다.
그럼 보안 관련 경고가 뜰수도 있는데 그냥 accept 누르시면 됩니다.
![](/assets\images\post\raspberry_pi\ch3.2\3.png)
  
이제 사용자 ID와 비밀번호를 입력하시면 접속 완료입니다.
![](/assets\images\post\raspberry_pi\ch3.2\4.png)


### 2.2 CMD로 접속하기
CMD를 킨 다음 아래 명령어를 입력해 줍니다.
```
ssh [사용자 ID]@[IP 주소]
```
그다음 비밀번호를 입력하면 접속 완료 입니다.
  
![](/assets\images\post\raspberry_pi\ch3.2\5.png)

### 2.3 VSC로 접속하기
extension에서 SSH를 검색하신 다음 Microsoft의 Remote-SSH를 설치해 줍니다.

![](/assets\images\post\raspberry_pi\ch3.2\6.png)

F1을 누른다음 Remote-SSH : Add New host...를 입력해 클릭합니다.  
그 다음 ssh [유저 ID]@[IP주소] 를 입력해 줍니다.  

![](/assets\images\post\raspberry_pi\ch3.2\7.png)
![](/assets\images\post\raspberry_pi\ch3.2\8.png)
![](/assets\images\post\raspberry_pi\ch3.2\9.png)

이러면 setup이 완료 되었습니다.  

이제 접속을 위해 F1을 누른뒤 Remote-SSH: Connect to Host...를 입력해 클릭합니다.  
그러면 아까 등록해 둔 IP 주소를 클릭하면 새로운 VSC 창이 뜹니다.  
그다음 Platform은 Linux를 선택해 줍니다.  


![](/assets\images\post\raspberry_pi\ch3.2\10.png)
![](/assets\images\post\raspberry_pi\ch3.2\11.png)
![](/assets\images\post\raspberry_pi\ch3.2\12.png)

좌측 하단에 SSH : IP주소 가 뜨면 연결 성공입니다.
![](/assets\images\post\raspberry_pi\ch3.2\13.png)



