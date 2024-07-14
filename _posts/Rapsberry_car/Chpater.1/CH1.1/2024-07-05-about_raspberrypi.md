---
layout: single
title: "1.1 라즈베리파이 개요"

toc: true
toc_sticky: true

---
# Welcome to Raspberry pi

## Raspberry pi란?

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

reference : [Raspberry Pi Datasheets](https://datasheets.raspberrypi.com/)  

note) 위는 제조사의 권장사항이며 USB 주변장치를 이용하지 않을경우 5V 700mA이상이면 충분합니다. 

