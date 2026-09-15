FROM rabbitmq:4.2-management-alpine

# Shovel plugins add "Move messages" to the management UI, used to send dead-lettered messages back for reprocessing.
RUN rabbitmq-plugins enable --offline rabbitmq_shovel rabbitmq_shovel_management

COPY rabbitmq.conf /etc/rabbitmq/conf.d/20-todolist.conf

EXPOSE 5672 15672
