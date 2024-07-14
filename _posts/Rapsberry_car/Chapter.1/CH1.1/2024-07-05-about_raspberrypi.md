---
layout: single
title: "1.1 라즈베리파이 개요"

toc: true
toc_sticky: true

---
# Welcome to Raspberry pi
![raspberry pi banner](/assets/images/post/raspberry_pi/raspberry-pi-banner.png)  




## Raspberry pi의 구조
![raspberry pi zero 2W image](/assets/images/post/raspberry_pi/Raspberry_pi_zero.png)
위는 Raspberry pi zero 2W 보드입니다.
- **USB port**  
    Micro 5pin 단자를 이용하는 USB 포트입니다.  
    전원을 공급할 수 있으며 마우스, 키보드같은 장치를 통해 입력을 할 수도 있습니다.
- **HDMI port**  
    Mini HDMI 단자를 이용하는 포트입니다.  
    모니터와 연결해 화면을 띄울 수 있습니다. 
- **SD card slot**  
    Micro SD card를 꽂는 슬롯입니다.  
    Raspberry pi가 데이터를 읽고 저장하기 위해 필요합니다.
- **Camera connector**  

- **GPIO pin**
    40개의 핀으로 되어 있습니다.  
    디지털 데이터를 입력받거나 출력할 수 있습니다.  
    VCC, GND 전원을 공급하거나 해당 핀을 통해 Raspberry pi 전원을 넣을 수 있습니다.

보드의 종류에 따라 더 많은 포트가 있고 포트의 형태도 다르니 참고바랍니다. 


## 전원 관리

라즈베리파이 전원을 제대로 공급하지 않으면 아래와 같은 문제점이 발생할 수 있습니다.  

1) 발열로 인한 장비 손상   
2) 정상적인 작동이 되지 않음  
3) 라즈베리파이 무한 재부팅  

따라서 Datasheet를 참고해서 라즈베리파이에 **적절한** 전압과 전류를 공급해야 합니다.

- **Raspberry pi 전원**  
<table>
  <thead> <tr> <th>모델명</th> <th>전압(V)</th> <th>전류(A)</th> </tr> </thead>
  <tbody> <tr> <td>Raspberry Pi Zero 2W</td> <td>5</td> <td>2.5</td> </tr>
          <tr> <td>Raspberry Pi 4 Model B</td> <td>5</td> <td>3</td> </tr>
          <tr> <td>Raspberry Pi 3 Model B+</td> <td>5</td> <td>2.5</td></tr> </tbody>
</table>

note) 위는 제조사의 권장사항이며 USB 주변장치를 이용하지 않을경우 5V 700mA이상이면 충분합니다. 







reference : [Raspberry Pi Datasheets](https://datasheets.raspberrypi.com/)  