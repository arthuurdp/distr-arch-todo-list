FROM rabbitmq:4.2-management-alpine

RUN rabbitmq-plugins enable --offline rabbitmq_shovel rabbitmq_shovel_management

COPY rabbitmq.conf /etc/rabbitmq/conf.d/20-todolist.conf

EXPOSE 5672 15672
