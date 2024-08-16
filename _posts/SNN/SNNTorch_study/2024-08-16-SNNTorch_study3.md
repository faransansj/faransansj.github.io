---
layout: single
title: "[SNNTorch] Tutorial 3 - The Leaky integrate and fire neuron"
categories: 
    - SNNTorch

toc: true
toc_sticky: true

---
<aside>
🎯 [Goal]
1) 딥러닝을 위한 LIF neron 모델 단순화
2) feedforward SNN 구현

</aside>

이전 Tutorial 2에서 설계된 LIF neuron model은 복잡하고 hyper parameter의 조정이 필요하다.
이때 파라미터의 추적은 어렵고 SNN으로의 확장을 할 시 더 복잡해 짐으로 단순화를 진행한다.

## LIF neuron model 단순화

### 감쇠율 : $\beta$

Euler 방법을 이용해 passive membrane 모델의 해는 다음과 같다.

$$
V_m(t+Δt)=V_m(t)+τΔt(−V_m(t)+I(t)R)
$$

이때 입력 전류 $I(t)$가 없는 경우를 가정한다.

$$
V_m(t+Δt)=V_m(t)−\frac{Δt}{τ}V_m(t)
$$

이때 막전위의 감쇠율을 $\beta$라고 하며 아래와 같다.

$$
\beta = \frac{V_m(t+\triangle t)}{V_m(t)}=1-\frac{\triangle t}{\tau}
$$

### 가중 입력 전류

t가 시퀀스의 의 시간 단계라고 가정하면 $\triangle t = 1$로 볼 수 있다. 또한 hyper parameter수를 줄이기 위해 $R = 1$로 가정하면 아래와 같은 식이 출력된다.

$$
\beta = 1 - \frac{1}{C} \to (1-\beta)I_{in}=\frac{1}{\tau}I_{in}
$$

이때 $1-\beta$를 입력 전류의 가중치라고 보며 membrane 전위에 순간적으로 기여한다고 가정한다.
또한 시간 구간이 짧아서 neuron은 하나의 Spike만 발생할 수 있다고 가정한다.

$$
V(t+1) = \beta V(t) + (1-\beta)I_{in}(t+1)
$$

deeplearning에선 입력의 가중치 계수가 학습 가능한 parameter로 사용된다.
이때 신호 $V(t)$와 가중치 W의 상호작용을 단순화 하기 위해 둘을 곱한 결과로 표현한다.

$$
V(t+1) = \beta V(t) + WX(t+1)
$$

### Spikint & Reset

막 전위가 임계값을 초과하면 뉴런이 출력 스파이크를 발생시킨다.

$$
S[t] = 1, if \;\;V(t)>V_{thr} \\
\;\;\;0, otherwise
$$

Spike가 발생하면 membrane 전위는 초기화가 되어야 한다.
이때 감소에 의한 리셋(reset by substraction) 모델은 다음과 같다.

$$
V(t+1) = \beta V(t) + WX(t+1)-S(t)V_{thr}
$$

이때 W는 학습 가능한 파라미터 이며 $V_{thr}$은 종종 1로 설정된다.

---

```python
def leaky_integrate_and_fire(mem, x, w, beta, threshold=1):
  spk = (mem > threshold)  # 막 전위가 임계값을 초과하면 spk=1, 그렇지 않으면 0
  mem = beta * mem + w * x - spk * threshold
  return spk, mem
```

```python
delta_t = torch.tensor(1e-3)
tau = torch.tensor(5e-3)
beta = torch.exp(-delta_t / tau)
print(f"The decay rate is: {beta:.3f}")
```

```python
num_steps = 200

# 입력/출력 초기화 및 작은 스텝 전류 입력
x = torch.cat((torch.zeros(10), torch.ones(190) * 0.5), 0)
mem = torch.zeros(1)
spk_out = torch.zeros(1)
mem_rec = []
spk_rec = []
```

```python
# 뉴런 파라미터
w = 0.4
beta = 0.819

# 뉴런 시뮬레이션
for step in range(num_steps):
  spk, mem = leaky_integrate_and_fire(mem, x[step], w=w, beta=beta)
  mem_rec.append(mem)
  spk_rec.append(spk)
```