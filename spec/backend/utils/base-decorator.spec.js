const BaseDecorator = require('@backend/utils/base-decorator')
const BaseProperty = require('@backend/adapters/base-property')
const resourceStub = require('../helpers/resource-stub')
const helperStub = require('../helpers/helper-stub')

describe('BaseDecorator', function () {
  beforeEach(function () {
    this.stubbedResource = resourceStub(this.sinon)
    this.stubbedAdmin = { options: {} }
    this.options = {
      name: 'Article',
      parent: {
        name: 'Knowledge',
        icon: 'icon-bomb',
      },
      listProperties: ['prop1', 'prop2', 'prop3'],
      actions: {
        edit: {
          enable: false,
        },
      },
    }
    this.args = {
      resource: this.stubbedResource,
      admin: this.stubbedAdmin,
    }
    this.customArgs = {
      ...this.args,
      options: this.options,
    }
  })

  describe('#getResourceName', function () {
    it('returns resource name when not overriden', function () {
      const decorator = new BaseDecorator(this.args)
      expect(decorator.getResourceName()).to.equal(resourceStub.expectedResult.resourceName)
    })
    it('returns overwriten resource name', function () {
      const decorator = new BaseDecorator(this.customArgs)
      expect(decorator.getResourceName()).to.equal('Article')
    })
  })

  describe('#getParent', function () {
    it('return parent when it is not overriden', function () {
      const decorator = new BaseDecorator(this.args)
      expect(decorator.getParent()).to.contain(resourceStub.expectedResult.parent)
    })
    it('return overwritten parent', function () {
      const decorator = new BaseDecorator(this.customArgs)
      expect(decorator.getParent()).to.deep.equal({ name: 'Knowledge', icon: 'icon-bomb' })
    })
  })

  describe('#getListProperties', function () {
    it('returns first 5 visible properties from resource when not overwriten', function () {
      this.decorator = new BaseDecorator(this.args)
      expect(this.decorator.getListProperties()).to.have.lengthOf(5)
    })

    context('listProperties is overwriten', function () {
      beforeEach(function () {
        this.decorator = new BaseDecorator(this.customArgs)
      })

      it('returns properties given in configuration', function () {
        this.propertyName = 'someProperty'
        this.stubbedResource.property.returns({ name: this.propertyName })
        const properties = this.decorator.getListProperties()
        expect(properties).to.have.lengthOf(3)
        expect(properties[0].name).to.equal(this.propertyName)
      })

      it('creates new property when it doesnt exist', function () {
        this.stubbedResource.property.returns(null) // there are no property for given name
        const properties = this.decorator.getListProperties()
        expect(properties).to.have.lengthOf(3)
      })
    })
  })

  describe('#getValue', function () {
    it('returns value from the resource when there is no override', function () {
      this.record = { param: this.sinon.spy() }
      this.decorator = new BaseDecorator(this.args)
      this.decorator.getValue({ record: this.record, property: new BaseProperty({ path: 'somename' }) })
      expect(this.record.param).to.have.been.called
    })
  })

  describe('#getRecordActions', function () {
    beforeEach(function () {
      this.stubbedHelper = helperStub(this.sinon)
    })

    context('user didnt override default actions', function () {
      beforeEach(function () {
        this.decorator = new BaseDecorator(this.args)
        this.decorator.helpers = this.stubbedHelper
      })

      it('returns default methods as an object', function () {
        this.record = { param: this.sinon.spy() }
        const ret = this.decorator.getRecordActions()
        expect(ret).to.have.keys('edit', 'show', 'remove')
      })
    })

    context('user hid edit action', function () {
      beforeEach(function () {
        this.decorator = new BaseDecorator(this.customArgs)
        this.decorator.helpers = this.stubbedHelper
        this.ret = this.decorator.getRecordActions()
      })
      it('returns all fields for declared actions', function () {
        const showPath = helperStub.expectedResult.showRecordUrl
        const removePath = helperStub.expectedResult.deleteRecordUrl
        expect(this.ret).to.deep.include({
          show: {
            path: showPath, icon: 'icomoon-info', label: 'Info', enable: true, isDefaultAction: true,
          },
          remove: {
            path: removePath, icon: 'icomoon-remove-2', label: 'Remove', enable: true, isDefaultAction: true,
          },
        })
      })
    })

    context('user created new action', function () {
      beforeEach(function () {
        this.customAction = {
          id: 'publish',
          icon: 'share',
          label: 'Publish',
          action: () => {},
        }
        const options = {
          actions: [this.customAction],
        }
        this.decorator = new BaseDecorator({ ...this.args, options })
        this.decorator.helpers = this.stubbedHelper
        this.ret = this.decorator.getRecordActions()
      })

      it('returns object containing new action', function () {
        expect(this.ret).to.have.keys('show', 'remove', 'edit', 'publish')
      })

      it('returns custom action object', function () {
        expect(this.ret.publish).to.deep.include(this.customAction)
      })
    })
  })
})
