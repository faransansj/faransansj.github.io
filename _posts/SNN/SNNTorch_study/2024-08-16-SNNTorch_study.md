---
layout: single
title: "[SNNTorch] Tutorial.1 Spike Encoding"
categories: 
    - SNNTorch

toc: true
toc_sticky: true

---

🎯 Goal   
1) Dataset을 spiking Dataset으로 변환  
2) 시각화 방법  
3) random spike trains 생성 방법  

## Intro

우리의 감각은 각각의 신호(빛, 냄새, 압력 등등)을 Spike로 변환 될 때 느낀다.

SNN을 구축하기 위해선 입력에서도 Spike 데이터를 입력하는 것이 맞으며 이때 데이터를 인코딩하는 데에는 3가지의 요소에서 비롯된다. 

![image.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/ce90ab93-92c1-4f63-bc78-f653762295c2/62c992be-4324-4e9b-98d1-e1c186593752/image.png)

- **Spike (a) - (b)**
    
    생물학적 뉴런들은 spike를 통해 정보를 처리하고 소통한다. 
    대략 100mV의 전압 변화를 통해 1, 0으로 데이터를 단순화 한다.
    → 데이터의 단순화를 통해 하드웨어에서 효율적으로 처리 가능해진다. 
    
- **Sparsity (c)**
    
    신경형 하드웨어 뉴런은 대부분이 비활성 즉 0인 상태로 유지하고 특정한 상황에서만 
    1로 활성화 되는 희소성(Sparsity)가 있다.
    
    space complexity : 모든 벡터, 행렬이 0인 형태는 흔하기에 해당 데이터를 재사용 할 수 있으며 
    또한 대부분의 요소가 0이면 1인 위치만 저장해도 됨으로 메모리 절약이 크다.
    
    time complexity : 0과 곱해지면 항상 0이니 이러한 과정의 계산 과정은 생략이 가능해진다.
    → 연산량이 줄어들어 계산 시간이 줄고 소비 전력도 줄어든다.
    
- **Static-suppression (d) - (e)**
    
    spike neuron의 출력은 0,1 이진의 값으로 표현될 수 있다. 
    즉 하드웨어의 구현이 단순해 짐으로써 하드웨어 구현이 단순해 진다.
    

---

## Setup

MNIST dataset을 로드하고 환경 세팅하는 과정

```powershell
$ pip install snntorch
```

### Import package, 환경 설정

```python
import snntorch as snn
import torch

# Training Parameters
batch_size=128
data_path='/tmp/data/mnist'
num_classes = 10  # MNIST has 10 output classes

# Torch Variables
dtype = torch.float
```

### MNIST dataset 다운로드

```python
from torchvision import datasets, transforms

# Define a transform
transform = transforms.Compose([
            transforms.Resize((28,28)),
            transforms.Grayscale(),
            transforms.ToTensor(),
            transforms.Normalize((0,), (1,))])

mnist_train = datasets.MNIST(data_path, train=True, download=True, transform=transform)
```

```python
from snntorch import utils

subset = 10
mnist_train = utils.data_subset(mnist_train, subset)

>>> print(f"The size of mnist_train is {len(mnist_train)}")
The size of mnist_train is 6000
```

### Dataloader

Dataloader은 데이터를 네트워크로 전달하기 위한 인터페이스로 batch_size 크기로 분할 된 데이터를 반환한다.

```python
from torch.utils.data import DataLoader

train_loader = DataLoader(mnist_train, batch_size=batch_size, shuffle=True)
```

---

## Spike encoding

SNN은 시간에 따라 변하는 데이터를 활용한다.
그런데 MNIST는 시간에 따라 변하는 데이터 셋이 아니다. 
따라서 MNIST를 SNN에서 사용하는 방법은 두 가지가 존재한다.

- **동일 샘플 전달**
    
    ![image.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/ce90ab93-92c1-4f63-bc78-f653762295c2/04261a35-d4ce-4166-836e-de0dd90f4a08/image.png)
    
    동일한 이미지를 SNN에 전달한다. 정지된 이미지의 동영상의 형태로 인코딩 한다고 보면 된다.
    다만 이를 이용할 경우 SNN의 시간적 요소를 활용하지 못한다는 단점이 존재한다.
    
- 시간에 따른 spike squence 변환
    
    ![image.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/ce90ab93-92c1-4f63-bc78-f653762295c2/bb22d3dc-da20-4f48-a821-39e494e25b08/image.png)
    
    입력을 spike 열로 변환 후 시간에 따라 변화하는 Spike squence로 변환된다.
    

### Spike Encoding function

SNNTorch에서 사용 가능한 Spike encoding은 세 가지가 존재한다.

1) Rate coding -  spiking **frequency**
2) latency coding -  spike **timing** 
3) delta modulation -  temporal **change** of input features to generate spikes

---

## Rate coding

특정 시간 동안 spike가 발생될 확률을 입력하고 베르누이 시행 

$$
P(R_{ij}=1)=X_{ij}=1-P(R_{ij}=0)
$$

$X_{ij}$은 Spike가 주어진 time step에서 일어날 확률로 사용된다.  
$R_{ij}$은 

```python
# Temporal Dynamics
num_steps = 10

# create vector filled with 0.5
raw_vector = torch.ones(num_steps) * 0.5

# pass each sample through a Bernoulli trial
rate_coded_vector = torch.bernoulli(raw_vector)
print(f"Converted vector: {rate_coded_vector}")
```

큰 수의 법칙에 의거해 num_steps가 증가할 수록 원래 raw값에 가까워 진다.

---

## Latency coding

---

## Delta modulation

---