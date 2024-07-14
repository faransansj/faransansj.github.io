---
layout: single
title: "2.3 Raspberry pi 성능 향상 시키기"

toc: true
toc_sticky: true

---

## Ram swap
![](/assets\images\post\raspberry_pi\ch2.3\1.png)
터미널을 실행한 다음 free -h를 입력해서 라즈베리파이의 메모리와 swap memory를 확인해줍니다.  

우선 아래의 명령어를 입력해 Swap service를 정지해야 합니다.
```
sudo service dphys-swapfile stop
```
그 다음 수정을 위해 Swapfile을 열어줍니다. 
```
sudo nano /etc/dphys-swapfile
```

![](/assets\images\post\raspberry_pi\ch2.3\2.png)
여기서 conf_swapsize 옆에 있는 숫자가 Swap memory의 용량입니다. 이를 원하는 용량으로 수정해 줍니다.  
(이때 방향키로 움직여야 합니다.)

![](/assets\images\post\raspberry_pi\ch2.3\3.png)
수정이 완료되었다면 "control + X"키를 누릅니다.  
그다음 "save modified buffer?"가 뜨면 y를 눌러줍니다.  

![](/assets\images\post\raspberry_pi\ch2.3\4.png)
enter키를 눌러줍니다.
이제 Swap service를 다시 시작해줘야 함으로 아래 명령어를 입력해 줍니다.
```
sudo service dphys-swapfile start
```
![](/assets\images\post\raspberry_pi\ch2.3\5.png)
그다음 free -h를 눌러 swap memory가 확장된 것을 확인할 수 있습니다.  
만약 안되면 라즈베리파이를 재부팅 한다음 확인해 보세요.  


## Overclock
⚠️ **주의사항** : 오버클럭은 소모 전력이 증가하며 적절한 발열 관리가 이뤄지지 않을 경우 CPU에 손상이 갈 수 있습니다. 가급적 보수적으로 옵션을 설정하는 걸 권장합니다. 
- **Dynamic Overclock**
    


## bench test