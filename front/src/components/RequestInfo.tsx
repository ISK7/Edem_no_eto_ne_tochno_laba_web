import { PAYMENT_LABELS, type TestDriveRequest } from '../types';
import { formatDate, formatDateTime, formatPhone, formatPrice } from '../utils/format';
import { Icon } from './Icon';
import { StatusBadge } from './StatusBadge';

interface RequestInfoProps {
  request: TestDriveRequest;
  showCustomer?: boolean;
}

export function RequestInfo({ request, showCustomer = false }: RequestInfoProps) {
  return (
    <div className="request-info">
      <div className="request-info__grid">
        <section className="request-info__group">
          <h4>Автомобиль и оплата</h4>
          <dl>
            <div>
              <dt>Марка и модель</dt>
              <dd>
                {request.car.brand} {request.car.model}
              </dd>
            </div>
            <div>
              <dt>Стоимость услуги</dt>
              <dd>{formatPrice(request.car.price)}</dd>
            </div>
            <div>
              <dt>Тип оплаты</dt>
              <dd>{PAYMENT_LABELS[request.paymentType] ?? request.paymentType}</dd>
            </div>
            <div>
              <dt>Статус</dt>
              <dd>
                <StatusBadge status={request.status} />
              </dd>
            </div>
          </dl>
        </section>

        <section className="request-info__group">
          <h4>Визит</h4>
          <dl>
            <div>
              <dt>Дата и время</dt>
              <dd>{formatDateTime(request.scheduledAt)}</dd>
            </div>
            <div>
              <dt>Адрес</dt>
              <dd>{request.address}</dd>
            </div>
            <div>
              <dt>Заявка создана</dt>
              <dd>{formatDateTime(request.createdAt)}</dd>
            </div>
          </dl>
        </section>

        <section className="request-info__group">
          <h4>Водительское удостоверение</h4>
          <dl>
            <div>
              <dt>Серия и номер</dt>
              <dd>
                {request.licenseSeries} № {request.licenseNumber}
              </dd>
            </div>
            <div>
              <dt>Дата выдачи</dt>
              <dd>{formatDate(request.licenseIssuedAt)}</dd>
            </div>
            <div>
              <dt>Контактный телефон</dt>
              <dd>{formatPhone(request.contactPhone)}</dd>
            </div>
          </dl>
        </section>

        {showCustomer && (
          <section className="request-info__group">
            <h4>Заказчик</h4>
            <dl>
              <div>
                <dt>ФИО</dt>
                <dd>{request.customer.fullName}</dd>
              </div>
              <div>
                <dt>Логин</dt>
                <dd>{request.customer.login}</dd>
              </div>
              <div>
                <dt>Связь</dt>
                <dd>
                  {formatPhone(request.customer.phone)}
                  <br />
                  {request.customer.email}
                </dd>
              </div>
            </dl>
          </section>
        )}
      </div>

      {request.rejectionReason && (
        <div className="callout callout--danger">
          <span className="callout__icon">
            <Icon name="info" size={18} />
          </span>
          <div>
            <strong>Причина отклонения</strong>
            <p>{request.rejectionReason}</p>
          </div>
        </div>
      )}
    </div>
  );
}
