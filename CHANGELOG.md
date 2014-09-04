## 0.0.5 (2014-09-04)

* Fixed a bug where functions queued with #after would run, even if that stage
  has been prevented

## 0.0.4 (2013-09-04)

* Add beforeSerial, so you can execute asynchronous functions before a stage
  begins and make it wait on a callback

## 0.0.3 (2013-05-30)

* Sputnik#launch will only launch the stages defined in its `order` parameter
* Added timeout options
* Add a "prevent" function, to make a stage wait to begin for another stage to end

## 0.0.2 (2013-04-17)

* Added a #getStage(name) method

## 0.0.1 (2013-04-16)

* First release