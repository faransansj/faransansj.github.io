---
layout: single
title: "[SNNTorch] Tutorial 2 - The Leaky integrate and fire neuron"
excerpt: "Leaky Integrate-and-Fire(LIF) 뉴런 모델의 동작 원리를 배웁니다. SNNTorch로 LIF 뉴런을 구현하고 시뮬레이션하는 방법을 실습합니다."
categories: 
    - SNNTorch
tags:
    - SNN
    - SNNTorch
    - LIF Neuron
    - Neural Networks

toc: true
toc_sticky: true

---
<aside>
🎯 [Goal]
1) leaky integrate-and-fire (LIF) neuron model 기초
2) SNNTorch를 이용한 1차 LIF neuron 구현

</aside>

## Neuron model의 종류

!https://github.com/jeshraghian/snntorch/blob/master/docs/_static/img/examples/tutorial2/2_1_neuronmodels.png?raw=true

- **Hodgkin-Huxley 뉴런 모델**
    
    생물물리학적으로 구현된 모델로 전기생리학적(electrophysiological) 결과를 매우 높은 정확도로 재현할 수 있지만 복잡성이 높아서 사용되지 않고 있음
    
- **인공 뉴런 모델**
    
    입력 값은 가중치와 곱해진 다음 활성화 함수(Activatoin function)에 전달된다.
    오늘날 AI에서 쓰이고 있는 분야다.
    
- **Leaky Integrate-and-Fire (LIF) 뉴런 모델**
    
    생물물리학 모델과 인공 뉴런 모델 두 모델이 섞인 모델이다.
    LIF 모델은 입력 값과 가중치의 곱한 값의 합을 계산한다. 이때 인공 뉴런 모델과 달리 시간에 따라 입력을 합하고 누출시킨다. 이때 합한 값이 임계값을 초과하면 전압 스파이크를 발생한다.
    
    이때 정보는 Spike에 저장되지 않고 Spike가 발생한 타이밍, 빈도에 정보가 저장된다.
    

### SNNTorch LIF model 종류

- Lapicque’s RC model: `snntorch.Lapicque`
- 1st-order model: `snntorch.Leaky`
- Synaptic Conductance-based neuron model: `snntorch.Synaptic`
- Recurrent 1st-order model: `snntorch.RLeaky`
- Recurrent Synaptic Conductance-based neuron model: `snntorch.RSynaptic`
- Alpha neuron model: `snntorch.Alpha`

---

## Leaky Integrate-and-Fire Neuron model

### Spiking neuron

우리의 뇌는 하나의 뉴런이 다른 뉴런과 연결되어 있다.
즉 하나의 뉴런이 Spike를 발생 시키면 연결된 뉴런이 흥분 or 억제 등 영향을 받게 된다. 

이때 감각은 다음과 같은 곳에서 온다.

- 감각 주변부 (sensory periphery)
- 뉴런을 인위적으로 자극 - 침습성 전극(invasive electrode), 혹은 대부분 상황
- 전 뉴런들로 부터 (pre-synaptic neurons)
    
    !https://github.com/jeshraghian/snntorch/blob/master/docs/_static/img/examples/tutorial2/2_2_intuition.png?raw=true
    

Spike는 매우 짧은 전기적 신호이기에 모든 입력 Spike가 동시에 도착하지 않는 경우가 많다.
따라서 neuron은 이러한 시간 차를 기억 or 유지하며 반응한다.
즉 뉴런은 입력된 Spike에 대해 바로 처리하지 않고 지연되면서 반응하는 특성을 가지고 있다.  

### The Passive membrane

neuron은 얇은 막으로 둘러싸여 있다. 이때 이 막은 절연체로 전도성 용액을 두 개로 분리해서
커패시터 역할을 한다.

또한 이온에 대해 불투과성이라 이온이 들어오거나 나가는 걸 막는다. 그런데 뉴런에 전류가 주입되면 채널의 변화로 인해 이온의 이동이 가능해 진다. 이는 저항 역할을 한다.

!https://github.com/jeshraghian/snntorch/blob/master/docs/_static/img/examples/tutorial2/2_3_passivemembrane.png?raw=true

---

## LIF neuron model 유도

임의의 시간에 따라 $I(t)$가 neuron에 주입된다고 가정
이때 키르히호프 전류법칙(Kirchhoff's Current Law)에 의거하여 아래와 같다.

$$
I(t) = I_R(t)+I_C(t)
$$

이때 옴의 법칙에 의거하여 뉴런 내부,외부 막 사이의 전위차 $V_m(t)$는 저항을 통해 구할 수 있다.

$$
V_m(t)=I_R(t)R
$$

커패시턴스 $C$는 저장된 전하 $Q(t)$와 막 전위 $V_m(t)$ 사이의 비례상수 이다.
그리고 전화의 변화율은 커패시터의 전류이다.

$$
I_C(t)=C\cdot \frac{dV_m(t)}{dt}
$$

따라서 $I(t)$은 아래와 같이 나타낼 수 있다.

$$
I(t) = \frac{V_m(t)}{R} + C \cdot \frac{dV_m(t)}{dt}
$$

이때 회로의 시간상수 $\tau = RC$로 $V_m(t)$함수와 그 도함수가 같은 형태가 될려면 시간상수 $\tau$도 지수적으로 감소하는 형태를 가져야 한다. 
따라서 $V_m(0) = V_0$ 이고 추가적인 입력이 없다고 가정하면($I(t)=0$) 미분 방정식의 해는 아래와 같다.

$$
V_m(t)=V_0 \cdot e^{-\frac{t}{\tau}}
$$

!https://github.com/jeshraghian/snntorch/blob/master/docs/_static/img/examples/tutorial2/2_4_RCmembrane.png?raw=true

---

## Forward Euler

---

## Lapicque’s LIF neuron model

- Without Stimulus
- Step inputs
- Pulse inputs
- Firing
- Spike inputs
- Reset Mechanisms

---