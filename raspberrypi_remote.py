import RPi.GPIO as GPIO
import time
import pygame

# 서보를 위한 GPIO 설정
GPIO.setmode(GPIO.BCM)

servo_pin = 27
GPIO.setup(servo_pin, GPIO.OUT)
servo_pwm = GPIO.PWM(servo_pin, 50)
servo_pwm.start(75)

# 모터를 위한 GPIO 설정
ENA = 19
IN1 = 26
IN2 = 13

# GPIO 핀 설정
GPIO.setup(ENA, GPIO.OUT)
GPIO.setup(IN1, GPIO.OUT)
GPIO.setup(IN2, GPIO.OUT)

# PWM 설정 (핀번호, 주파수(Hz))
pwmENA = GPIO.PWM(ENA, 1000)  # ENA 핀에 1000Hz로 PWM 설정
pwmENA.start(0)  # ENA PWM 신호를 100% 듀티 사이클로 시작 (최대 속도)

# 초기 서보 각도 설정
current_servo_angle = 0
servo_pwm.ChangeDutyCycle(current_servo_angle / 18 + 2)

# 초기 모터 속도 설정
motor_speed = 0

def update_servo_angle(direction):
    global current_servo_angle
    if direction == 'left':
        current_servo_angle -= 5
    elif direction == 'right':
        current_servo_angle += 5

    # 서보 각도를 0과 180 사이로 제한
    current_servo_angle = max(0, min(current_servo_angle, 180))
    print(current_servo_angle)

    # 서보 각도 업데이트
    servo_pwm.ChangeDutyCycle(current_servo_angle / 18 + 2)

def update_motor_speed(direction):
    global motor_speed
    if direction == 'up':
        motor_speed += 10
    elif direction == 'down':
        motor_speed -= 10

    # 모터 속도를 -100과 100 사이로 제한
    motor_speed = max(-100, min(motor_speed, 100))
    print(motor_speed)

    # 모터 속도 업데이트
    if motor_speed >= 0:
        GPIO.output(IN1, GPIO.LOW)
        GPIO.output(IN2, GPIO.HIGH)
        pwmENA.ChangeDutyCycle(motor_speed)
    else:
        GPIO.output(IN1, GPIO.HIGH)
        GPIO.output(IN2, GPIO.LOW)
        pwmENA.ChangeDutyCycle(-motor_speed)

# pygame 초기화
pygame.init()
pygame.display.set_mode((1, 1), pygame.NOFRAME)  # 가상 디스플레이 모드 설정

# 메인 루프
while True:
    for event in pygame.event.get():
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_UP:
                update_motor_speed('up')
                print('up')
            elif event.key == pygame.K_DOWN:
                update_motor_speed('down')
                print('down')
            elif event.key == pygame.K_LEFT:
                update_servo_angle('left')
                print('left')
            elif event.key == pygame.K_RIGHT:
                update_servo_angle('right')
                print('right')

            # Enter 키를 누르면 정지
            elif event.key == pygame.K_RETURN:
                motor_speed = 0
                pwmENA.ChangeDutyCycle(0)

    # 여기에 컴퓨터 비전을 위한 기존 코드를 추가하세요

# 루프를 빠져나올 때 GPIO 및 pygame 정리
servo_pwm.stop()
pwmENA.stop()
pwmENB.stop()
GPIO.cleanup()
pygame.quit()
