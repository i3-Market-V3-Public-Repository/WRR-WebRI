import {dateField} from "/lib/utils";

export
function fd2register(fd) {
  const datasetC = parseInt(fd.get("datasetC"));

  const hasDataset = (Array.from(Array(datasetC).keys())).map((item, idx) => {
    const datasetEK = "dataset" + idx;

    if (!fd.has(datasetEK + "distributionC"))
      return null;

    const distributionC = parseInt(fd.get(datasetEK + "distributionC"));

    const distribution = (Array.from(Array(distributionC).keys())).map((item, idx) => {
      const distributionEK = datasetEK + "distribution" + idx;

      if (!fd.has(distributionEK + "title"))
        return null;

      const accessServiceC = parseInt(fd.get(distributionEK + "accessServiceC"));

      const accessService = (Array.from(Array(accessServiceC).keys())).map((item, idx) => {
        const accessServiceEK = distributionEK + "accessService" + idx;

        if (!fd.has(accessServiceEK + "conformsTo"))
          return null;

        return {
          endpointDescription: fd.get(accessServiceEK + "endpointDescription"),
          endpointURL: fd.get(accessServiceEK + "endpointUrl"),
          conformsTo: fd.get(accessServiceEK + "conformsTo"),
          servesDataset: fd.get(accessServiceEK + "servesDataset"),
          serviceSpecs: fd.get(accessServiceEK + "serviceSpecs"),
        };
      }).filter(item => !!item);

      return {
        title: fd.get(distributionEK + "title"),
        description: fd.get(distributionEK + "description"),
        license: fd.get(distributionEK + "license"),
        conformsTo: fd.get(distributionEK + "conformsTo"),
        mediaType: fd.get(distributionEK + "mediaType"),
        packageFormat: fd.get(distributionEK + "packageFormat"),
        accessService,
      };
    }).filter(item => !!item);

    const datasetInformationC = parseInt(fd.get(datasetEK + "informationC"));

    const datasetInformation = (Array.from(Array(datasetInformationC).keys())).map((item, idx) => {
      const informationEK = datasetEK + "information" + idx;

      if (!fd.has(informationEK + "cppType"))
        return null;

      return {
        cppType: fd.get(informationEK + "cppType"),
        deviceID: fd.get(informationEK + "deviceID"),
        measurementChannelType: fd.get(informationEK + "measurementChannelType"),
        measurementType: fd.get(informationEK + "measurementType"),
        sensorID: fd.get(informationEK + "sensorID"),
        sensorType: fd.get(informationEK + "sensorType"),
      };
    }).filter(item => !!item);

    let ret = {
      title: fd.get(datasetEK + "title"),
      description: fd.get(datasetEK + "description"),
      creator: fd.get(datasetEK + "creator"),
      // issued: dateStrToISO(fd.get(datasetEK + "issued")),
      // modified: dateStrToISO(fd.get(datasetEK + "modified")),
      language: fd.get(datasetEK + "language"),
      temporal: fd.get(datasetEK + "temporal"),
      temporalResolution: fd.get(datasetEK + "temporalResolution"),
      spatial: fd.get(datasetEK + "spatial"),
      accrualPeriodicity: fd.get(datasetEK + "accrualPeriodicity"),
      distribution,
      datasetInformation,
    };

    dateField(ret, 'issued', fd.get(datasetEK + "issued"));
    dateField(ret, 'modified', fd.get(datasetEK + "modified"));

    return ret;
  }).filter(item => !!item);

  const pricingModelC = parseInt(fd.get("pricingModelC"));

  const hasPricingModel = (Array.from(Array(pricingModelC).keys())).map((item, idx) => {
    const pricingModelEK = "pricingModel" + idx;

    if (!fd.has(pricingModelEK + "paymentTypeC"))
      return null;

    const paymentTypeC = parseInt(fd.get(pricingModelEK + "paymentTypeC"));

    const hasPaymentType = (Array.from(Array(paymentTypeC).keys())).map((item, idx) => {
      const paymentTypeEK = pricingModelEK + "paymentType" + idx;

      if (!fd.has(paymentTypeEK + "repeat"))
        return null;

      let ret = {
        hasSubscriptionPrice: fd.get(paymentTypeEK + "subscriptionPrice"),
        // fromValue: dateStrToISO(fd.get(paymentTypeEK + "from")),
        // toValue: dateStrToISO(fd.get(paymentTypeEK + "to")),
        paymentType: fd.get(paymentTypeEK + "paymentType"),
        repeat: fd.get(paymentTypeEK + "repeat"),
        timeDuration: fd.get(paymentTypeEK + "timeDuration"),
      }

      dateField(ret, 'fromValue', fd.get(paymentTypeEK + "from"));
      dateField(ret, 'toValue', fd.get(paymentTypeEK + "to"));

      return ret;
    }).filter(item => !!item);

    return {
      basicPrice: fd.get(pricingModelEK + "basicPrice"),
      currency: fd.get(pricingModelEK + "currency"),
      hasPaymentType,
    };
  }).filter(item => !!item);

  return {
    title: fd.get("title"),
    description: fd.get("description"),
    category: fd.get("category"),
    isProvidedBy: fd.get("isProvidedBy"),
    label: fd.get("label"),
    hasDataset,
    hasPricingModel,
  };
}

